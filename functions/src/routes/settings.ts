import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';

const router = Router();

const defaultSettings = {
  learningStyle: 'standard',
  flashcardMode: false,
  shadowingMode: false,
  mnemonicMode: false,
  storyMode: false,
  dailyReminders: false,
};

// GET /api/settings/user/:userId
router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (req.uid !== userId) return res.status(403).json({ error: 'Forbidden' });

  try {
    const ref = db.collection('settings').doc(userId);
    const snap = await ref.get();

    if (!snap.exists) {
      const data = { ...defaultSettings, userId, updatedAt: new Date().toISOString() };
      await ref.set(data);
      return res.json({ id: userId, ...data });
    }

    return res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/settings/user/:userId
router.put('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (req.uid !== userId) return res.status(403).json({ error: 'Forbidden' });

  const allowed = ['learningStyle', 'flashcardMode', 'shadowingMode', 'mnemonicMode', 'storyMode', 'dailyReminders'];
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  try {
    const ref = db.collection('settings').doc(userId);
    await ref.set({ userId, ...updates }, { merge: true });
    const snap = await ref.get();
    return res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
