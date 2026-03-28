import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/schedule/user/:userId
router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (req.uid !== userId) return res.status(403).json({ error: 'Forbidden' });

  try {
    const snap = await db
      .collection('schedules')
      .where('userId', '==', userId)
      .orderBy('dayOfWeek')
      .get();

    const schedules = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(schedules);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/schedule — create a schedule entry
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { userId, dayOfWeek, startTime, duration = 30 } = req.body;
  if (req.uid !== userId) return res.status(403).json({ error: 'Forbidden' });

  if (dayOfWeek === undefined || !startTime) {
    return res.status(400).json({ error: 'dayOfWeek and startTime are required' });
  }

  try {
    const now = new Date().toISOString();
    const ref = await db.collection('schedules').add({
      userId,
      dayOfWeek,
      startTime,
      duration,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const snap = await ref.get();
    return res.status(201).json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/schedule/:id — update a schedule entry
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const ref = db.collection('schedules').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    if (snap.data()!.userId !== req.uid) return res.status(403).json({ error: 'Forbidden' });

    const allowed = ['dayOfWeek', 'startTime', 'duration', 'active'];
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    await ref.update(updates);
    const updated = await ref.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/schedule/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const ref = db.collection('schedules').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    if (snap.data()!.userId !== req.uid) return res.status(403).json({ error: 'Forbidden' });

    await ref.delete();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
