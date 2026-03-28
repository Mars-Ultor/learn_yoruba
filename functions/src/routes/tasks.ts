import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /tasks/daily — get or generate today's task list
router.get('/daily', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const today = new Date().toISOString().split('T')[0];

  try {
    const taskRef = db.collection('dailyTasks').doc(uid).collection('days').doc(today);
    const taskDoc = await taskRef.get();

    if (taskDoc.exists) {
      res.json({ date: today, tasks: taskDoc.data()!.tasks });
      return;
    }

    // Generate adaptive tasks based on weakAreas
    const userDoc = await db.collection('users').doc(uid).get();
    const weakAreas: string[] = userDoc.exists
      ? (userDoc.data()!.weakAreas as string[]) ?? []
      : [];

    const tasks = buildDailyTasks(weakAreas);
    await taskRef.set({ tasks, generatedAt: new Date().toISOString() });

    res.json({ date: today, tasks });
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tasks/daily/complete — mark a task completed, increment progress
router.post('/daily/complete', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { taskId, increment = 1 } = req.body as { taskId: string; increment?: number };

  if (!taskId) {
    res.status(400).json({ error: 'taskId required' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const taskRef = db.collection('dailyTasks').doc(uid).collection('days').doc(today);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      res.status(404).json({ error: 'No daily tasks found for today' });
      return;
    }

    const tasks = taskDoc.data()!.tasks as any[];
    const idx = tasks.findIndex((t: any) => t.id === taskId);
    if (idx === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    tasks[idx].progress = Math.min(tasks[idx].target, (tasks[idx].progress || 0) + increment);
    tasks[idx].completed = tasks[idx].progress >= tasks[idx].target;

    await taskRef.update({ tasks });

    // Also update daily goal completedLessons count
    if (tasks[idx].type === 'lesson' && tasks[idx].completed) {
      const goalRef = db
        .collection('users')
        .doc(uid)
        .collection('dailyGoals')
        .doc(today);
      const goalDoc = await goalRef.get();
      if (goalDoc.exists) {
        await goalRef.update({
          completedLessons: (goalDoc.data()!.completedLessons || 0) + 1,
        });
      }
    }

    res.json({ taskId, task: tasks[idx] });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Task generator ───────────────────────────────────────────────────────────

function buildDailyTasks(weakAreas: string[]): any[] {
  const tasks: any[] = [
    {
      id: 'lesson_1',
      type: 'lesson',
      title: 'Complete a lesson',
      description: 'Finish any lesson with a score above 70%',
      target: 1,
      progress: 0,
      completed: false,
    },
    {
      id: 'flashcard_1',
      type: 'flashcard',
      title: 'Review flashcards',
      description: 'Review 10 vocabulary flashcards',
      target: 10,
      progress: 0,
      completed: false,
    },
    {
      id: 'quiz_1',
      type: 'quiz',
      title: 'Take a quiz',
      description: 'Complete a quiz on any lesson',
      target: 1,
      progress: 0,
      completed: false,
    },
  ];

  // Add targeted tasks for weak areas
  if (weakAreas.includes('conversation')) {
    tasks.push({
      id: 'conversation_1',
      type: 'conversation',
      title: 'Conversation practice',
      description: 'Practice a conversation scenario',
      target: 1,
      progress: 0,
      completed: false,
    });
  }

  if (weakAreas.includes('vocabulary') || weakAreas.includes('grammar')) {
    tasks.push({
      id: 'writing_1',
      type: 'writing',
      title: 'Writing practice',
      description: 'Complete a writing exercise and get AI feedback',
      target: 1,
      progress: 0,
      completed: false,
    });
  }

  if (weakAreas.includes('listening') || weakAreas.length === 0) {
    tasks.push({
      id: 'reading_1',
      type: 'reading',
      title: 'Reading comprehension',
      description: 'Read a Yoruba passage and answer questions',
      target: 1,
      progress: 0,
      completed: false,
    });
  }

  return tasks;
}

export default router;
