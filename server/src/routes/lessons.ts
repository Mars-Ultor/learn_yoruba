import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET all lessons
router.get('/', async (req: Request, res: Response) => {
  try {
    const lessons = await prisma.lesson.findMany({
      include: {
        phrases: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET lesson by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        phrases: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
    if (lesson) {
      res.json(lesson);
    } else {
      res.status(404).json({ error: 'Lesson not found' });
    }
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET lessons by difficulty
router.get('/difficulty/:level', async (req: Request, res: Response) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        difficulty: req.params.level,
      },
      include: {
        phrases: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET lessons by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        category: req.params.category,
      },
      include: {
        phrases: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
