import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';
import { awardXP, progressMissions, evaluateAchievements, updateAdaptiveProfile } from '../lib/gamification';

const router = Router();

// GET user progress — authenticated owner only
router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  if ((req as any).uid !== req.params.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const userId = req.params.userId as string;
    const progressSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('progress')
      .orderBy('lastAttemptDate', 'desc')
      .get();

    const progress = await Promise.all(
      progressSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        // Fetch lesson info
        const lessonDoc = await db.collection('lessons').doc(doc.id).get();
        return {
          id: doc.id,
          lessonId: doc.id,
          userId,
          ...data,
          lesson: lessonDoc.exists ? { id: lessonDoc.id, ...lessonDoc.data() } : null,
        };
      })
    );
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST update progress — authenticated owner only
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { userId, lessonId, score } = req.body;

  if (!userId || !lessonId || score === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if ((req as any).uid !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const scoreNum = Number(score);
  if (!Number.isFinite(scoreNum) || scoreNum < 0 || scoreNum > 100) {
    res.status(400).json({ error: 'score must be a number between 0 and 100' });
    return;
  }

  try {
    const progressRef = db
      .collection('users')
      .doc(userId)
      .collection('progress')
      .doc(lessonId);

    const existingDoc = await progressRef.get();
    let xpEarned = 0;

    if (existingDoc.exists) {
      const existing = existingDoc.data()!;
      const newScore = Math.max(existing.score, scoreNum);
      xpEarned = Math.max(0, newScore - existing.score);
      await progressRef.update({
        score: newScore,
        attempts: existing.attempts + 1,
        lastAttemptDate: new Date().toISOString(),
        completed: newScore >= 70,
      });
    } else {
      xpEarned = scoreNum;
      const newProgress = {
        completed: scoreNum >= 70,
        score: scoreNum,
        attempts: 1,
        lastAttemptDate: new Date().toISOString(),
      };
      await progressRef.set(newProgress);
    }

    // Award XP and check for level-up
    const { leveledUp, newLevel, totalPoints } = xpEarned > 0
      ? await awardXP(userId, xpEarned)
      : { leveledUp: false, newLevel: 1, totalPoints: 0 };

    // Unblock next lesson if this one is now completed with >=70
    let unlockedLessonId: string | null = null;
    if (scoreNum >= 70) {
      const nextLessonSnap = await db
        .collection('lessons')
        .where('prerequisiteId', '==', lessonId)
        .limit(1)
        .get();
      if (!nextLessonSnap.empty) {
        unlockedLessonId = nextLessonSnap.docs[0].id;
      }
    }

    // Fire-and-forget side effects
    Promise.all([
      progressMissions(userId, 'complete_lesson'),
      evaluateAchievements(userId),
      updateAdaptiveProfile(userId),
    ]).catch((e) => console.error('Side effects error:', e));

    const updated = await progressRef.get();
    const status = existingDoc.exists ? 200 : 201;
    res.status(status).json({
      id: lessonId,
      ...updated.data(),
      xpEarned,
      leveledUp,
      newLevel,
      totalPoints,
      unlockedLessonId,
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET daily goals — authenticated owner only
router.get('/goals/:userId', requireAuth, async (req: Request, res: Response) => {
  if ((req as any).uid !== req.params.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    const goalRef = db
      .collection('users')
      .doc(req.params.userId as string)
      .collection('dailyGoals')
      .doc(dateStr);

    const goalDoc = await goalRef.get();

    if (goalDoc.exists) {
      res.json({ id: goalDoc.id, ...goalDoc.data() });
    } else {
      const newGoal = {
        date: dateStr,
        targetMinutes: 15,
        completedMinutes: 0,
        targetLessons: 3,
        completedLessons: 0,
      };
      await goalRef.set(newGoal);
      res.json({ id: dateStr, ...newGoal });
    }
  } catch (error) {
    console.error('Error fetching daily goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST update daily goal — authenticated owner only
router.post('/goals', requireAuth, async (req: Request, res: Response) => {
  const { userId, completedMinutes, completedLessons } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }

  if ((req as any).uid !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const goalRef = db
      .collection('users')
      .doc(userId)
      .collection('dailyGoals')
      .doc(dateStr);

    const goalDoc = await goalRef.get();

    if (goalDoc.exists) {
      const existing = goalDoc.data()!;
      const updateData: Record<string, number> = {};
      if (completedMinutes !== undefined) updateData.completedMinutes = completedMinutes;
      if (completedLessons !== undefined) updateData.completedLessons = completedLessons;
      await goalRef.update(updateData);
      const updated = await goalRef.get();
      res.json({ id: dateStr, ...updated.data() });
    } else {
      const newGoal = {
        date: dateStr,
        targetMinutes: 15,
        completedMinutes: completedMinutes || 0,
        targetLessons: 3,
        completedLessons: completedLessons || 0,
      };
      await goalRef.set(newGoal);
      res.status(201).json({ id: dateStr, ...newGoal });
    }
  } catch (error) {
    console.error('Error updating daily goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
