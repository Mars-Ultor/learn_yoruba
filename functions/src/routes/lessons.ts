import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';

const router = Router();

// GET all lessons
router.get('/', async (req: Request, res: Response) => {
  try {
    const lessonsSnapshot = await db.collection('lessons').orderBy('order', 'asc').get();
    const lessons = await Promise.all(
      lessonsSnapshot.docs.map(async (doc) => {
        const phrasesSnapshot = await db
          .collection('lessons')
          .doc(doc.id)
          .collection('phrases')
          .orderBy('order', 'asc')
          .get();
        const phrases = phrasesSnapshot.docs.map((p) => ({ id: p.id, ...p.data() }));
        return { id: doc.id, ...doc.data(), phrases };
      })
    );
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET lesson by ID
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
    const lessonsSnapshot = await db
      .collection('lessons')
      .where('difficulty', '==', req.params.level)
      .orderBy('order', 'asc')
      .get();
    const lessons = await Promise.all(
      lessonsSnapshot.docs.map(async (doc) => {
        const phrasesSnapshot = await db
          .collection('lessons')
          .doc(doc.id)
          .collection('phrases')
          .orderBy('order', 'asc')
          .get();
        const phrases = phrasesSnapshot.docs.map((p) => ({ id: p.id, ...p.data() }));
        return { id: doc.id, ...doc.data(), phrases };
      })
    );
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET lessons by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const lessonsSnapshot = await db
      .collection('lessons')
      .where('category', '==', req.params.category)
      .orderBy('order', 'asc')
      .get();
    const lessons = await Promise.all(
      lessonsSnapshot.docs.map(async (doc) => {
        const phrasesSnapshot = await db
          .collection('lessons')
          .doc(doc.id)
          .collection('phrases')
          .orderBy('order', 'asc')
          .get();
        const phrases = phrasesSnapshot.docs.map((p) => ({ id: p.id, ...p.data() }));
        return { id: doc.id, ...doc.data(), phrases };
      })
    );
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
