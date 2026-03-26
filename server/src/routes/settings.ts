import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/settings/user/:userId  — get settings, auto-creating defaults if absent
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings/user/:userId  — upsert settings
router.put('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const {
      learningStyle,
      flashcardMode,
      shadowingMode,
      mnemonicMode,
      storyMode,
      dailyReminders,
    } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...(learningStyle !== undefined && { learningStyle }),
        ...(flashcardMode !== undefined && { flashcardMode }),
        ...(shadowingMode !== undefined && { shadowingMode }),
        ...(mnemonicMode !== undefined && { mnemonicMode }),
        ...(storyMode !== undefined && { storyMode }),
        ...(dailyReminders !== undefined && { dailyReminders }),
      },
      update: {
        ...(learningStyle !== undefined && { learningStyle }),
        ...(flashcardMode !== undefined && { flashcardMode }),
        ...(shadowingMode !== undefined && { shadowingMode }),
        ...(mnemonicMode !== undefined && { mnemonicMode }),
        ...(storyMode !== undefined && { storyMode }),
        ...(dailyReminders !== undefined && { dailyReminders }),
      },
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
