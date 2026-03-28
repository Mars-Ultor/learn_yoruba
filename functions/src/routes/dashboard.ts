import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /dashboard/recs — personalised recommendations for the adaptive dashboard
router.get('/recs', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const today = new Date().toISOString().split('T')[0];

  try {
    const [userDoc, progressSnap, goalDoc, missionsSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(uid).collection('progress').get(),
      db
        .collection('users')
        .doc(uid)
        .collection('dailyGoals')
        .doc(today)
        .get(),
      db
        .collection('userMissions')
        .doc(uid)
        .collection('active')
        .where('completed', '==', false)
        .limit(3)
        .get(),
    ]);

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = userDoc.data()!;
    const progressMap = new Map<string, { completed: boolean; score: number }>();
    for (const doc of progressSnap.docs) {
      progressMap.set(doc.id, {
        completed: doc.data().completed ?? false,
        score: doc.data().score ?? 0,
      });
    }

    // Find the next lesson to recommend (first locked or incomplete lesson in order)
    const lessonsSnap = await db
      .collection('lessons')
      .orderBy('order', 'asc')
      .limit(30)
      .get();

    let nextLesson: Record<string, any> | null = null;
    let continueLesson: Record<string, any> | null = null;

    for (const doc of lessonsSnap.docs) {
      const data = doc.data();
      const p = progressMap.get(doc.id);
      if (!p || !p.completed) {
        const prereq = data.prerequisiteId as string | undefined;
        const prereqDone = !prereq || (progressMap.get(prereq)?.score ?? 0) >= 70;
        if (prereqDone) {
          if (p && p.score > 0 && !p.completed) {
            continueLesson = { id: doc.id, ...data, score: p.score };
          } else if (!p) {
            nextLesson = nextLesson ?? { id: doc.id, ...data };
          }
        }
        if (nextLesson && continueLesson) break;
      }
    }

    // Weak vocab for review
    const weakAreas: string[] = userData.weakAreas ?? [];

    // Active missions summary
    const activeMissions = await Promise.all(
      missionsSnap.docs.map(async (d) => {
        const data = d.data();
        const mDoc = await db.collection('missions').doc(data.missionId).get();
        return {
          id: d.id,
          progress: data.progress,
          completed: data.completed,
          mission: mDoc.exists ? { id: mDoc.id, ...mDoc.data() } : null,
        };
      }),
    );

    // Daily goal
    const goal = goalDoc.exists
      ? goalDoc.data()
      : { targetMinutes: 15, completedMinutes: 0, targetLessons: 3, completedLessons: 0 };

    res.json({
      user: {
        streak: userData.streak ?? 0,
        totalPoints: userData.totalPoints ?? 0,
        level: userData.level ?? 1,
        xpToNextLevel: userData.xpToNextLevel ?? 500,
      },
      continueLesson,
      nextLesson,
      weakAreas,
      dailyGoal: goal,
      activeMissions,
    });
  } catch (error) {
    console.error('Error fetching dashboard recs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
