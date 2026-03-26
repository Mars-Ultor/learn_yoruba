import { Router, Request, Response } from 'express';
import { db, auth } from '../lib/firebase';

const router = Router();

// GET user profile
router.get('/:id', async (req: Request, res: Response) => {
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
      streak: userData.streak,
      totalPoints: userData.totalPoints,
      level: userData.level,
      lastActiveAt: userData.lastActiveAt,
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
      lastActiveAt: now,
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

export default router;
