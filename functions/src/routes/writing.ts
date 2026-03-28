import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';
import { awardXP, progressMissions } from '../lib/gamification';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rotating writing prompts (augmented by seed data; could also come from Firestore)
const WRITING_PROMPTS = [
  { yoruba: 'Ẹ kú àárọ̀, orúkọ mi ni ___', english: 'Good morning, my name is ___' },
  { yoruba: 'Mo fẹ́ ra ___', english: 'I want to buy ___' },
  { yoruba: 'Níbo ni ___ wà?', english: 'Where is ___?' },
  { yoruba: 'Ọjọ́ orí mi ni ___', english: 'My age is ___' },
  { yoruba: 'Mo ní ___ nínú ìdílé mi', english: 'I have ___ in my family' },
  { yoruba: 'Ẹ jẹ́ kí n sọ nípa ___', english: 'Let me talk about ___' },
];

// GET /writing/prompt — return one writing prompt
router.get('/prompt', requireAuth, async (_req: Request, res: Response) => {
  const prompt = WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)];
  res.json(prompt);
});

// POST /writing/submit — save submission and get Claude feedback
router.post('/submit', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { prompt, response: userResponse } = req.body as {
    prompt: string;
    response: string;
  };

  if (!prompt || !userResponse) {
    res.status(400).json({ error: 'prompt and response required' });
    return;
  }

  if (userResponse.length > 2000) {
    res.status(400).json({ error: 'response too long (max 2000 characters)' });
    return;
  }

  try {
    let feedback = '';
    let score = 50;

    const aiMessage = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      system:
        'You are Adébáyọ̀, a warm and patient Yoruba language tutor. ' +
        'The student has completed a writing exercise. ' +
        'Give concise, encouraging feedback (2-4 sentences) on their Yoruba writing. ' +
        'Point out 1-2 specific strengths and 1 area to improve. ' +
        'End with a score out of 100. Format: "Score: XX/100" on the last line.',
      messages: [
        {
          role: 'user',
          content: `Prompt: "${prompt}"\n\nStudent's response: "${userResponse}"`,
        },
      ],
    });

    const raw = aiMessage.content[0].type === 'text' ? aiMessage.content[0].text : '';
    feedback = raw;

    // Extract score
    const scoreMatch = raw.match(/Score:\s*(\d+)/i);
    if (scoreMatch) score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));

    const xpEarned = Math.round(score / 4); // up to 25 XP per writing

    const submission = {
      prompt,
      response: userResponse,
      feedback,
      score,
      xpEarned,
      submittedAt: new Date().toISOString(),
    };

    await db
      .collection('writingSubmissions')
      .doc(uid)
      .collection('submissions')
      .add(submission);

    const { leveledUp, newLevel, totalPoints } = await awardXP(uid, xpEarned);
    progressMissions(uid, 'submit_writing').catch(console.error);

    res.json({ ...submission, leveledUp, newLevel, totalPoints });
  } catch (error) {
    console.error('Error submitting writing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /writing/history — user's past writing submissions
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const snap = await db
      .collection('writingSubmissions')
      .doc(uid)
      .collection('submissions')
      .orderBy('submittedAt', 'desc')
      .limit(20)
      .get();

    const submissions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching writing history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
