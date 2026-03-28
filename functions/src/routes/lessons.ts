import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Helper: attach phrases to lesson docs (without full phrase loading for list views)
async function withPhrases(docs: FirebaseFirestore.QueryDocumentSnapshot[]) {
  return Promise.all(
    docs.map(async (doc) => {
      const phrasesSnap = await db
        .collection('lessons')
        .doc(doc.id)
        .collection('phrases')
        .orderBy('order', 'asc')
        .get();
      return {
        id: doc.id,
        ...doc.data(),
        phrases: phrasesSnap.docs.map((p) => ({ id: p.id, ...p.data() })),
      };
    }),
  );
}

// GET all lessons — paginated, no phrases in list responses for performance
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));

    const baseQuery = db.collection('lessons').orderBy('order', 'asc');
    const total = (await db.collection('lessons').count().get()).data().count;

    const snap = await baseQuery
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    // List view: no phrases to keep payload small
    const lessons = snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), phrases: [] }));

    res.json({ data: lessons, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /lessons/unlocked — lessons the authenticated user can access
router.get('/unlocked', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const [lessonsSnap, progressSnap] = await Promise.all([
      db.collection('lessons').orderBy('order', 'asc').get(),
      db.collection('users').doc(uid).collection('progress').get(),
    ]);

    const progressMap = new Map<string, { completed: boolean; score: number }>();
    for (const doc of progressSnap.docs) {
      const d = doc.data();
      progressMap.set(doc.id, { completed: d.completed ?? false, score: d.score ?? 0 });
    }

    const unlockedIds: string[] = [];
    for (const doc of lessonsSnap.docs) {
      const data = doc.data();
      const prereq = data.prerequisiteId as string | undefined;
      const minScore: number = data.minimumScoreToUnlock ?? 70;

      if (!prereq) {
        // No prerequisite → always unlocked
        unlockedIds.push(doc.id);
      } else {
        const prereqProgress = progressMap.get(prereq);
        if (prereqProgress && prereqProgress.score >= minScore) {
          unlockedIds.push(doc.id);
        }
      }
    }

    res.json({ unlockedIds });
  } catch (error) {
    console.error('Error fetching unlocked lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET lesson by ID (with phrases)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const lessonDoc = await db.collection('lessons').doc(id).get();
    if (!lessonDoc.exists) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }
    const phrasesSnapshot = await db
      .collection('lessons')
      .doc(id)
      .collection('phrases')
      .orderBy('order', 'asc')
      .get();
    const phrases = phrasesSnapshot.docs.map((p) => ({ id: p.id, ...p.data() }));
    res.json({ id: lessonDoc.id, ...lessonDoc.data(), phrases });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET lessons by difficulty
router.get('/difficulty/:level', async (req: Request, res: Response) => {
  try {
    const snap = await db
      .collection('lessons')
      .where('difficulty', '==', req.params.level as string)
      .orderBy('order', 'asc')
      .get();
    const lessons = await withPhrases(snap.docs);
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET lessons by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const snap = await db
      .collection('lessons')
      .where('category', '==', req.params.category as string)
      .orderBy('order', 'asc')
      .get();
    const lessons = await withPhrases(snap.docs);
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
