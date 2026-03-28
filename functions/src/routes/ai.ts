import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';
import { progressMissions } from '../lib/gamification';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TUTOR_SYSTEM = `You are Adébáyọ̀, a warm, patient, and encouraging Yoruba language tutor. 
Your student is learning Yoruba from scratch.
- Keep responses concise (2-4 sentences unless the student asks for more detail).
- Use Yoruba words with English translations in parentheses where helpful.
- Praise effort, gently correct mistakes, and give one actionable tip.
- Never make the student feel embarrassed.
- When correcting pronunciation hints, show the tone marks clearly.`;

// POST /ai/tutor — send a message to the AI tutor
router.post('/tutor', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { message, history = [] } = req.body as {
    message: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message required' });
    return;
  }

  if (message.length > 1000) {
    res.status(400).json({ error: 'message too long (max 1000 characters)' });
    return;
  }

  // Cap history to last 10 turns to keep token usage bounded
  const cappedHistory = history.slice(-10).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: String(m.content).slice(0, 500),
  }));

  try {
    const aiResponse = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 400,
      system: TUTOR_SYSTEM,
      messages: [...cappedHistory, { role: 'user', content: message }],
    });

    const reply =
      aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';

    // Persist message pair to Firestore (async, not blocking)
    db.collection('tutorSessions')
      .doc(uid)
      .collection('messages')
      .add({
        userMessage: message,
        assistantReply: reply,
        timestamp: new Date().toISOString(),
      })
      .catch(console.error);

    progressMissions(uid, 'use_tutor').catch(console.error);

    res.json({ reply });
  } catch (error) {
    console.error('AI tutor error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// ─── Conversation Scenarios ───────────────────────────────────────────────────

const SCENARIO_SYSTEM: Record<string, string> = {
  market: `You are a Yoruba market vendor named Mama Kémi. 
Speak mostly in Yoruba with English translations in parentheses. 
The student is a customer at a Lagos market. Keep responses short (1-3 sentences).
Gently correct Yoruba mistakes in square brackets like: [Correction: say "Ẹ káàbọ̀" for welcome].`,

  greetings: `You are a friendly Yoruba neighbour named Bàbá Àjàyí. 
Practice everyday greetings with the student. Use Yoruba with translations.
Respond naturally and add one new Yoruba phrase per turn to teach.
Keep responses short (2-3 sentences).`,

  family: `You are a Yoruba elder discussing family. 
The student should describe their family in Yoruba. Guide them with prompts.
Correct mistakes politely in square brackets. Use rich family vocabulary.
Keep responses short (2-3 sentences).`,
};

// POST /ai/conversation/start — open a new conversation session
router.post('/conversation/start', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { topic } = req.body as { topic: string };

  const validTopics = Object.keys(SCENARIO_SYSTEM);
  if (!topic || !validTopics.includes(topic)) {
    res.status(400).json({ error: `topic must be one of: ${validTopics.join(', ')}` });
    return;
  }

  try {
    // Get opening line from AI
    const aiResponse = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 150,
      system: SCENARIO_SYSTEM[topic],
      messages: [{ role: 'user', content: 'Start the conversation naturally.' }],
    });

    const opening =
      aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : 'Ẹ káàbọ̀!';

    const session = {
      topic,
      messages: [
        {
          role: 'assistant' as const,
          content: opening,
          timestamp: new Date().toISOString(),
        },
      ],
      startedAt: new Date().toISOString(),
    };

    const docRef = await db
      .collection('conversations')
      .doc(uid)
      .collection('sessions')
      .add(session);

    res.status(201).json({ id: docRef.id, ...session });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /ai/conversation/message — send a message in an ongoing session
router.post('/conversation/message', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { sessionId, message } = req.body as { sessionId: string; message: string };

  if (!sessionId || !message) {
    res.status(400).json({ error: 'sessionId and message required' });
    return;
  }

  if (message.length > 1000) {
    res.status(400).json({ error: 'message too long (max 1000 characters)' });
    return;
  }

  try {
    const sessionRef = db
      .collection('conversations')
      .doc(uid)
      .collection('sessions')
      .doc(sessionId);

    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const sessionData = sessionDoc.data()!;
    const topic: string = sessionData.topic;
    const existingMessages: Array<{ role: string; content: string; timestamp: string }> =
      sessionData.messages ?? [];

    // Cap history to last 12 messages
    const historyForAI = existingMessages.slice(-12).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content).slice(0, 500),
    }));

    const aiResponse = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 200,
      system: SCENARIO_SYSTEM[topic] ?? SCENARIO_SYSTEM.greetings,
      messages: [...historyForAI, { role: 'user', content: message }],
    });

    const reply =
      aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';

    const now = new Date().toISOString();
    const newMessages = [
      ...existingMessages,
      { role: 'user', content: message, timestamp: now },
      { role: 'assistant', content: reply, timestamp: now },
    ];

    await sessionRef.update({ messages: newMessages });

    progressMissions(uid, 'conversation_turn').catch(console.error);

    res.json({ reply, messages: newMessages });
  } catch (error) {
    console.error('Conversation message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /ai/conversation/end — end session and get summary
router.post('/conversation/end', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { sessionId } = req.body as { sessionId: string };

  if (!sessionId) {
    res.status(400).json({ error: 'sessionId required' });
    return;
  }

  try {
    const sessionRef = db
      .collection('conversations')
      .doc(uid)
      .collection('sessions')
      .doc(sessionId);

    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const sessionData = sessionDoc.data()!;
    const messages = (sessionData.messages ?? []) as Array<{
      role: string;
      content: string;
    }>;

    const userMessages = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');

    let summary = 'Great conversation practice!';
    if (userMessages.length > 0) {
      const summaryResponse = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 200,
        system: 'You are a Yoruba tutor. Give a brief (2-3 sentence) summary of what the student practised and one key tip.',
        messages: [
          {
            role: 'user',
            content: `Summarise this student's conversation practice:\n${userMessages}`,
          },
        ],
      });
      if (summaryResponse.content[0].type === 'text') {
        summary = summaryResponse.content[0].text;
      }
    }

    const endedAt = new Date().toISOString();
    await sessionRef.update({ endedAt, summary });

    progressMissions(uid, 'complete_conversation').catch(console.error);

    res.json({ summary, endedAt });
  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /ai/conversation/sessions — list user's past sessions (without messages)
router.get('/conversation/sessions', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  try {
    const snap = await db
      .collection('conversations')
      .doc(uid)
      .collection('sessions')
      .orderBy('startedAt', 'desc')
      .limit(20)
      .get();

    const sessions = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        topic: data.topic,
        startedAt: data.startedAt,
        endedAt: data.endedAt ?? null,
        summary: data.summary ?? null,
        messageCount: (data.messages as any[]).length,
      };
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching conversation sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
