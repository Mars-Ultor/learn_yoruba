import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';

const router = Router();

// GET all vocabulary
router.get('/', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('vocabulary').get();
    const vocabulary = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(vocabulary);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET vocabulary by type
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection('vocabulary')
      .where('type', '==', req.params.type)
      .get();
    const vocabulary = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(vocabulary);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET vocabulary by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('vocabulary').doc(req.params.id as string).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Vocabulary not found' });
      return;
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
