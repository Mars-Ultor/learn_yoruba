import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/** SM-2 algorithm
 * quality: 0=Again, 1=Hard, 2=Good, 3=Easy
 * Returns updated { easeFactor, interval, repetitions, nextReview }
 */
function sm2(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number,
): { repetitions: number; easeFactor: number; interval: number; nextReview: Date } {
  let newRepetitions = repetitions;
  let newEaseFactor = easeFactor;
  let newInterval = interval;

  if (quality < 1) {
    // Again — reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    if (repetitions === 0) newInterval = 1;
    else if (repetitions === 1) newInterval = 6;
    else newInterval = Math.round(interval * easeFactor);

    newRepetitions = repetitions + 1;
    newEaseFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return { repetitions: newRepetitions, easeFactor: newEaseFactor, interval: newInterval, nextReview };
}

type CardWithVocab = Awaited<ReturnType<typeof prisma.flashcardReview.findMany<{ include: { vocabulary: true } }>>>[number];

function parseCard(c: CardWithVocab) {
  return {
    ...c,
    vocabulary: {
      ...c.vocabulary,
      examples: JSON.parse((c.vocabulary as { examples: string }).examples ?? '[]'),
    },
  };
}

// GET /api/flashcards/user/:userId/due  — return cards due for review (nextReview <= now)
router.get('/user/:userId/due', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const cards = await prisma.flashcardReview.findMany({
      where: { userId, nextReview: { lte: new Date() } },
      include: { vocabulary: true },
      orderBy: { nextReview: 'asc' },
    });
    res.json(cards.map(parseCard));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch due flashcards' });
  }
});

// GET /api/flashcards/user/:userId/all  — all flashcard records for a user
router.get('/user/:userId/all', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const cards = await prisma.flashcardReview.findMany({
      where: { userId },
      include: { vocabulary: true },
      orderBy: { nextReview: 'asc' },
    });
    res.json(cards.map(parseCard));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

// POST /api/flashcards/user/:userId/init
// Creates FlashcardReview records for every vocabulary item the user doesn't already have
router.post('/user/:userId/init', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const allVocab = await prisma.vocabulary.findMany({ select: { id: true } });
    const existing = await prisma.flashcardReview.findMany({
      where: { userId },
      select: { vocabularyId: true },
    });
    const existingIds = new Set(existing.map((r) => r.vocabularyId));
    const toCreate = allVocab.filter((v) => !existingIds.has(v.id));

    if (toCreate.length > 0) {
      await prisma.flashcardReview.createMany({
        data: toCreate.map((v) => ({ userId, vocabularyId: v.id })),
        skipDuplicates: true,
      });
    }
    res.json({ created: toCreate.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialise flashcards' });
  }
});

// POST /api/flashcards/review  — submit a review result and update SRS values
router.post('/review', async (req: Request, res: Response) => {
  try {
    const { userId, vocabularyId, quality } = req.body; // quality: 0-3
    if (!userId || !vocabularyId || quality === undefined) {
      return res.status(400).json({ error: 'userId, vocabularyId and quality are required' });
    }

    const card = await prisma.flashcardReview.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId } },
    });

    if (!card) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const updated = sm2(quality, card.repetitions, card.easeFactor, card.interval);

    const result = await prisma.flashcardReview.update({
      where: { userId_vocabularyId: { userId, vocabularyId } },
      data: {
        repetitions: updated.repetitions,
        easeFactor: updated.easeFactor,
        interval: updated.interval,
        nextReview: updated.nextReview,
        lastReview: new Date(),
      },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record review' });
  }
});

export default router;
