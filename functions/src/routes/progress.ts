import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';

const router = Router();

// GET user progress
router.get('/user/:userId', async (req: Request, res: Response) => {
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

// POST update progress
router.post('/', async (req: Request, res: Response) => {
  const { userId, lessonId, score } = req.body;

  if (!userId || !lessonId || score === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const progressRef = db
      .collection('users')
      .doc(userId)
      .collection('progress')
      .doc(lessonId);

    const existingDoc = await progressRef.get();

    if (existingDoc.exists) {
      const existing = existingDoc.data()!;
      const newScore = Math.max(existing.score, score);
      await progressRef.update({
        score: newScore,
        attempts: existing.attempts + 1,
        lastAttemptDate: new Date().toISOString(),
        completed: score >= 70,
      });

      const pointsEarned = Math.max(0, score - existing.score);
      if (pointsEarned > 0) {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const currentPoints = userDoc.data()!.totalPoints || 0;
          await userRef.update({ totalPoints: currentPoints + pointsEarned });
        }
      }

      const updated = await progressRef.get();
      res.json({ id: lessonId, ...updated.data() });
    } else {
      const newProgress = {
        completed: score >= 70,
        score,
        attempts: 1,
        lastAttemptDate: new Date().toISOString(),
      };
      await progressRef.set(newProgress);

      // Award points
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const currentPoints = userDoc.data()!.totalPoints || 0;
        await userRef.update({ totalPoints: currentPoints + score });
      }

      res.status(201).json({ id: lessonId, ...newProgress });
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET daily goals
router.get('/goals/:userId', async (req: Request, res: Response) => {
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

// POST update daily goal
router.post('/goals', async (req: Request, res: Response) => {
  const { userId, completedMinutes, completedLessons } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
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
