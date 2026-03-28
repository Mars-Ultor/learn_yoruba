import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /achievements — all achievements + which ones the user has unlocked
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const [allSnap, unlockedSnap] = await Promise.all([
      db.collection('achievements').get(),
      db.collection('userAchievements').doc(uid).collection('unlocked').get(),
    ]);

    const unlockedMap = new Map<string, string>();
    for (const doc of unlockedSnap.docs) {
      const data = doc.data();
      unlockedMap.set(data.achievementId, data.unlockedAt);
    }

    const achievements = allSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      unlockedAt: unlockedMap.get(doc.id) ?? null,
    }));

    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
