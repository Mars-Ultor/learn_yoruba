import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// SM-2 constants
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

function nextInterval(reps: number, ease: number): number {
  if (reps <= 1) return 1;
  if (reps === 2) return 6;
  return Math.round(nextInterval(reps - 1, ease) * ease);
}

function adjustEase(ease: number, quality: number): number {
  const newEase = ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  return Math.max(MIN_EASE, newEase);
}

// GET /api/flashcards/user/:userId/due — cards due for review today
router.get('/user/:userId/due', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (req.uid !== userId) return res.status(403).json({ error: 'Forbidden' });

  try {
    const now = new Date().toISOString();
    // Simple query: only filter by userId, then filter + sort in memory
    const snap = await db
      .collection('flashcards')
      .where('userId', '==', userId)
      .get();

    const dueDocs = snap.docs
      .filter((doc) => (doc.data().nextReview ?? '') <= now)
      .sort((a, b) => (a.data().nextReview ?? '').localeCompare(b.data().nextReview ?? ''))
      .slice(0, 50);

    const cards = await Promise.all(
      dueDocs.map(async (doc) => {
        const data = doc.data();
        // Embed vocabulary
        const vocabSnap = await db.collection('vocabulary').doc(data.vocabularyId).get();
        return {
          id: doc.id,
          ...data,
          vocabulary: vocabSnap.exists ? { id: vocabSnap.id, ...vocabSnap.data() } : null,
        };
      }),
    );

    return res.json(cards);
  } catch (err: any) {
    console.error('flashcards/due error:', err?.message ?? err);
    return res.status(500).json({ error: 'Internal server error', detail: err?.message });
  }
});

// GET /api/flashcards/user/:userId/all — all user cards
router.get('/user/:userId/all', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (req.uid !== userId) return res.status(403).json({ error: 'Forbidden' });

  try {
    const snap = await db
      .collection('flashcards')
      .where('userId', '==', userId)
      .orderBy('nextReview')
      .get();

    const cards = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(cards);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/flashcards/user/:userId/init — initialise deck from all vocabulary
router.post('/user/:userId/init', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (req.uid !== userId) return res.status(403).json({ error: 'Forbidden' });

  try {
    // Get existing flashcard vocab IDs
    const existingSnap = await db
      .collection('flashcards')
      .where('userId', '==', userId)
      .select('vocabularyId')
      .get();
    const existingIds = new Set(existingSnap.docs.map((d) => d.data().vocabularyId));

    // Get all vocabulary
    const vocabSnap = await db.collection('vocabulary').get();
    const now = new Date().toISOString();
    const batch = db.batch();
    let added = 0;

    for (const doc of vocabSnap.docs) {
      if (existingIds.has(doc.id)) continue;
      const ref = db.collection('flashcards').doc();
      batch.set(ref, {
        userId,
        vocabularyId: doc.id,
        easeFactor: DEFAULT_EASE,
        interval: 0,
        repetitions: 0,
        nextReview: now,
        lastReview: now,
      });
      added++;
    }

    if (added > 0) await batch.commit();
    return res.json({ added, total: existingIds.size + added });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/flashcards/review — review a single card
router.post('/review', requireAuth, async (req: Request, res: Response) => {
  const { userId, vocabularyId, quality } = req.body;
  if (req.uid !== userId) return res.status(403).json({ error: 'Forbidden' });
  if (quality === undefined || quality < 0 || quality > 3) {
    return res.status(400).json({ error: 'quality must be 0-3' });
  }

  // Map 0-3 to SM-2 0-5 scale: 0→0, 1→2, 2→3, 3→5
  const sm2Quality = [0, 2, 3, 5][quality];

  try {
    const snap = await db
      .collection('flashcards')
      .where('userId', '==', userId)
      .where('vocabularyId', '==', vocabularyId)
      .limit(1)
      .get();

    if (snap.empty) return res.status(404).json({ error: 'Card not found' });

    const doc = snap.docs[0];
    const data = doc.data();

    let reps = data.repetitions;
    let ease = data.easeFactor;

    if (sm2Quality < 3) {
      reps = 0;
    } else {
      reps += 1;
    }

    ease = adjustEase(ease, sm2Quality);
    const interval = nextInterval(reps, ease);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await doc.ref.update({
      repetitions: reps,
      easeFactor: ease,
      interval,
      nextReview: nextReview.toISOString(),
      lastReview: new Date().toISOString(),
    });

    return res.json({ success: true, nextReview: nextReview.toISOString(), interval });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
