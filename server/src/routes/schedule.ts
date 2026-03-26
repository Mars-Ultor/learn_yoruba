import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/schedule/user/:userId  — fetch all schedule entries for a user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const schedules = await prisma.learningSchedule.findMany({
      where: { userId: req.params.userId as string },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// POST /api/schedule  — create a new schedule entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, dayOfWeek, startTime, duration } = req.body;
    if (!userId || dayOfWeek === undefined || !startTime) {
      return res.status(400).json({ error: 'userId, dayOfWeek, and startTime are required' });
    }
    const entry = await prisma.learningSchedule.create({
      data: { userId, dayOfWeek, startTime, duration: duration ?? 30 },
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create schedule entry' });
  }
});

// PUT /api/schedule/:id  — update a schedule entry
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, startTime, duration, active } = req.body;
    const entry = await prisma.learningSchedule.update({
      where: { id: req.params.id as string },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(startTime !== undefined && { startTime }),
        ...(duration !== undefined && { duration }),
        ...(active !== undefined && { active }),
      },
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update schedule entry' });
  }
});

// DELETE /api/schedule/:id  — remove a schedule entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.learningSchedule.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete schedule entry' });
  }
});

export default router;
