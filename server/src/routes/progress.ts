import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET user progress
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userProgress = await prisma.userProgress.findMany({
      where: {
        userId: req.params.userId,
      },
      include: {
        lesson: true,
      },
      orderBy: {
        lastAttemptDate: 'desc',
      },
    });
    res.json(userProgress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST update progress
router.post('/', async (req: Request, res: Response) => {
  const { userId, lessonId, score } = req.body;
  
  if (!userId || !lessonId || score === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (existingProgress) {
      const updatedProgress = await prisma.userProgress.update({
        where: {
          id: existingProgress.id,
        },
        data: {
          score: Math.max(existingProgress.score, score),
          attempts: existingProgress.attempts + 1,
          lastAttemptDate: new Date(),
          completed: score >= 70,
        },
      });

      const pointsEarned = Math.max(0, score - existingProgress.score);
      if (pointsEarned > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            totalPoints: { increment: pointsEarned },
          },
        });
      }

      res.json(updatedProgress);
    } else {
      const newProgress = await prisma.userProgress.create({
        data: {
          userId,
          lessonId,
          completed: score >= 70,
          score,
          attempts: 1,
          lastAttemptDate: new Date(),
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: { increment: score },
        },
      });

      res.status(201).json(newProgress);
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
    today.setHours(0, 0, 0, 0);

    let goal = await prisma.dailyGoal.findFirst({
      where: {
        userId: req.params.userId,
        date: {
          gte: today,
        },
      },
    });

    if (!goal) {
      goal = await prisma.dailyGoal.create({
        data: {
          userId: req.params.userId,
          date: new Date(),
          targetMinutes: 15,
          completedMinutes: 0,
          targetLessons: 3,
          completedLessons: 0,
        },
      });
    }

    res.json(goal);
  } catch (error) {
    console.error('Error fetching daily goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST update daily goal
router.post('/goals', async (req: Request, res: Response) => {
  const { userId, completedMinutes, completedLessons } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingGoal = await prisma.dailyGoal.findFirst({
      where: {
        userId,
        date: {
          gte: today,
        },
      },
    });

    if (existingGoal) {
      const updatedGoal = await prisma.dailyGoal.update({
        where: { id: existingGoal.id },
        data: {
          completedMinutes: completedMinutes !== undefined ? completedMinutes : existingGoal.completedMinutes,
          completedLessons: completedLessons !== undefined ? completedLessons : existingGoal.completedLessons,
        },
      });
      res.json(updatedGoal);
    } else {
      const newGoal = await prisma.dailyGoal.create({
        data: {
          userId,
          date: new Date(),
          targetMinutes: 15,
          completedMinutes: completedMinutes || 0,
          targetLessons: 3,
          completedLessons: completedLessons || 0,
        },
      });
      res.status(201).json(newGoal);
    }
  } catch (error) {
    console.error('Error updating daily goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
