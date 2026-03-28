import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /onboarding/status
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const doc = await db.collection('onboarding').doc(uid).get();
    if (!doc.exists) {
      res.json({ completed: false });
      return;
    }
    res.json({ completed: doc.data()!.completed ?? false, ...doc.data() });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /onboarding/complete — save wizard results, set daily goal, mark done
router.post('/complete', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { learningStyle, dailyGoalMinutes } = req.body as {
    learningStyle: string;
    dailyGoalMinutes: number;
  };

  const validStyles = ['standard', 'intensive', 'story', 'immersion'];
  if (!learningStyle || !validStyles.includes(learningStyle)) {
    res.status(400).json({ error: `learningStyle must be one of: ${validStyles.join(', ')}` });
    return;
  }

  const goalMinutes = Number(dailyGoalMinutes);
  if (!Number.isFinite(goalMinutes) || goalMinutes < 5 || goalMinutes > 120) {
    res.status(400).json({ error: 'dailyGoalMinutes must be between 5 and 120' });
    return;
  }

  try {
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    await Promise.all([
      // Save onboarding record
      db.collection('onboarding').doc(uid).set({
        learningStyle,
        dailyGoalMinutes: goalMinutes,
        completed: true,
        completedAt: now,
      }),
      // Update user's onboardingComplete flag + learning style preference
      db.collection('users').doc(uid).update({
        onboardingComplete: true,
        learningStyle,
      }),
      // Upsert today's daily goal with the chosen target
      db
        .collection('users')
        .doc(uid)
        .collection('dailyGoals')
        .doc(today)
        .set(
          {
            date: today,
            targetMinutes: goalMinutes,
            completedMinutes: 0,
            targetLessons: 3,
            completedLessons: 0,
          },
          { merge: true },
        ),
    ]);

    res.json({ completed: true, learningStyle, dailyGoalMinutes: goalMinutes });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
