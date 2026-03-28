import { Router, Request, Response } from 'express';
import { db, auth } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';
import { evaluateAchievements } from '../lib/gamification';

const router = Router();

// GET user profile — caller must be the owner of the profile
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  // Prevent users from reading other users' profiles
  if ((req as any).uid !== req.params.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const userDoc = await db.collection('users').doc(req.params.id as string).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userData = userDoc.data()!;
    res.json({
      id: userDoc.id,
      email: userData.email,
      username: userData.username,
      createdAt: userData.createdAt,
      streak: userData.streak ?? 0,
      totalPoints: userData.totalPoints ?? 0,
      level: userData.level ?? 1,
      xpToNextLevel: userData.xpToNextLevel ?? 500,
      lastActiveDate: userData.lastActiveDate,
      lastActiveAt: userData.lastActiveAt,
      onboardingComplete: userData.onboardingComplete ?? false,
      weakAreas: userData.weakAreas ?? [],
      strongAreas: userData.strongAreas ?? [],
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST register new user (creates Firestore profile after Firebase Auth signup on client)
router.post('/register', async (req: Request, res: Response) => {
  const { uid, email, username } = req.body;

  if (!uid || !email || !username) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const existingUser = await db.collection('users').doc(uid).get();
    if (existingUser.exists) {
      res.status(400).json({ error: 'User profile already exists' });
      return;
    }

    const now = new Date().toISOString();
    const userData = {
      email,
      username,
      streak: 0,
      totalPoints: 0,
      level: 1,
      xpToNextLevel: 500,
      lastActiveAt: now,
      lastActiveDate: now.split('T')[0],
      onboardingComplete: false,
      weakAreas: [],
      strongAreas: [],
      createdAt: now,
    };

    await db.collection('users').doc(uid).set(userData);

    res.status(201).json({
      message: 'User created successfully',
      user: { id: uid, ...userData },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/check-in — update streak; call on every login
router.post('/check-in', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const data = userDoc.data()!;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate: string | undefined = data.lastActiveDate;
    const now = new Date().toISOString();

    let streak: number = data.streak ?? 0;
    let streakReset = false;

    if (!lastDate) {
      // First check-in
      streak = 1;
    } else if (lastDate === todayStr) {
      // Already checked in today — no change
    } else {
      const last = new Date(lastDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);

      if (diffDays === 1) {
        streak += 1;
      } else {
        streakReset = streak > 0;
        streak = 1;
      }
    }

    await userRef.update({
      streak,
      lastActiveDate: todayStr,
      lastActiveAt: now,
    });

    await evaluateAchievements(uid);

    res.json({ streak, streakReset, lastActiveDate: todayStr });
  } catch (error) {
    console.error('Error in check-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
