import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';
import { awardXP, progressMissions } from '../lib/gamification';

const router = Router();

// GET /reading — paginated list of reading exercises
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
    const difficulty = req.query.difficulty as string | undefined;

    let query = db.collection('readingExercises').orderBy('difficulty');
    if (difficulty) query = query.where('difficulty', '==', difficulty) as any;

    const total = (await query.count().get()).data().count;
    const snap = await query
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    const exercises = snap.docs.map((d) => ({
      id: d.id,
      title: d.data().title,
      difficulty: d.data().difficulty,
      questionCount: (d.data().questions as any[]).length,
    }));

    res.json({ data: exercises, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching reading exercises:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reading/:id — single exercise with full passage + questions
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('readingExercises').doc(req.params.id as string).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Exercise not found' });
      return;
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching reading exercise:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reading/:id/submit — grade answers, save score, award XP
router.post('/:id/submit', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { answers } = req.body as { answers: Record<string, string> };

  if (!answers) {
    res.status(400).json({ error: 'answers required' });
    return;
  }

  try {
    const doc = await db.collection('readingExercises').doc(req.params.id as string).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Exercise not found' });
      return;
    }

    const exercise = doc.data()!;
    const questions = exercise.questions as Array<{ id: string; correct: string }>;

    let correct = 0;
    for (const q of questions) {
      if (answers[q.id]?.trim() === q.correct?.trim()) correct++;
    }
    const score = Math.round((correct / questions.length) * 100);
    const xpEarned = Math.round(score / 2);

    await db
      .collection('readingAttempts')
      .doc(uid)
      .collection('sessions')
      .add({
        exerciseId: doc.id,
        score,
        answers,
        completedAt: new Date().toISOString(),
      });

    const { leveledUp, newLevel, totalPoints } = await awardXP(uid, xpEarned);
    progressMissions(uid, 'complete_reading').catch(console.error);

    res.json({ score, correct, total: questions.length, xpEarned, leveledUp, newLevel, totalPoints });
  } catch (error) {
    console.error('Error submitting reading exercise:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
