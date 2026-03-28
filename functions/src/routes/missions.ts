import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';
import { awardXP } from '../lib/gamification';

const router = Router();

// GET /missions/active — list active missions with user progress
router.get('/active', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    // Seed daily + weekly missions into userMissions if they don't exist yet for today
    await ensureDailyMissions(uid);

    const activeSnap = await db
      .collection('userMissions')
      .doc(uid)
      .collection('active')
      .get();

    const missions = await Promise.all(
      activeSnap.docs.map(async (doc) => {
        const data = doc.data();
        const missionDoc = await db.collection('missions').doc(data.missionId).get();
        return {
          id: doc.id,
          ...data,
          mission: missionDoc.exists ? { id: missionDoc.id, ...missionDoc.data() } : null,
        };
      }),
    );

    res.json(missions);
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /missions/claim — claim reward for a completed mission
router.post('/claim', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { userMissionId } = req.body;

  if (!userMissionId) {
    res.status(400).json({ error: 'Missing userMissionId' });
    return;
  }

  try {
    const missionRef = db
      .collection('userMissions')
      .doc(uid)
      .collection('active')
      .doc(userMissionId);

    const missionDoc = await missionRef.get();
    if (!missionDoc.exists) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }

    const missionData = missionDoc.data()!;
    if (!missionData.completed) {
      res.status(400).json({ error: 'Mission not yet completed' });
      return;
    }
    if (missionData.claimedAt) {
      res.status(400).json({ error: 'Reward already claimed' });
      return;
    }

    const globalMission = await db.collection('missions').doc(missionData.missionId).get();
    if (!globalMission.exists) {
      res.status(404).json({ error: 'Mission definition not found' });
      return;
    }

    const reward = globalMission.data()!.reward as { xp: number; badge?: string };
    const { leveledUp, newLevel, totalPoints } = await awardXP(uid, reward.xp);
    await missionRef.update({ claimedAt: new Date().toISOString() });

    res.json({ claimed: true, xpEarned: reward.xp, leveledUp, newLevel, totalPoints });
  } catch (error) {
    console.error('Error claiming mission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureDailyMissions(uid: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Check if we already seeded today's missions
  const existingSnap = await db
    .collection('userMissions')
    .doc(uid)
    .collection('active')
    .where('seedDate', '==', today)
    .limit(1)
    .get();

  if (!existingSnap.empty) return;

  // Fetch daily missions from global collection
  const dailySnap = await db
    .collection('missions')
    .where('type', '==', 'daily')
    .get();

  const batch = db.batch();
  for (const doc of dailySnap.docs) {
    const ref = db
      .collection('userMissions')
      .doc(uid)
      .collection('active')
      .doc(`daily_${today}_${doc.id}`);
    batch.set(
      ref,
      {
        missionId: doc.id,
        progress: 0,
        completed: false,
        seedDate: today,
        claimedAt: null,
      },
      { merge: false },
    );
  }
  await batch.commit();
}

export default router;
