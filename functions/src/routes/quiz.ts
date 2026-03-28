import { Router, Request, Response } from 'express';
import { db } from '../lib/firebase';
import { requireAuth } from '../middleware/auth';
import { awardXP, progressMissions, evaluateAchievements } from '../lib/gamification';
import type { QuizQuestion } from '../types';

const router = Router();

// POST /quiz/generate — generate quiz questions from a lesson
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  const { lessonId } = req.body;
  if (!lessonId) {
    res.status(400).json({ error: 'lessonId required' });
    return;
  }

  try {
    const phrasesSnap = await db
      .collection('lessons')
      .doc(lessonId as string)
      .collection('phrases')
      .get();

    if (phrasesSnap.empty) {
      res.status(404).json({ error: 'No phrases found for this lesson' });
      return;
    }

    const phrases = phrasesSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);

    // Collect distractors from the same lesson
    const allEnglish = phrases.map((p: any) => p.english as string);
    const allYoruba = phrases.map((p: any) => p.yoruba as string);

    const questions: QuizQuestion[] = phrases
      .slice(0, Math.min(phrases.length, 10))
      .map((phrase: any, i: number) => {
        const type: QuizQuestion['type'] = i % 3 === 0
          ? 'fill-blank'
          : i % 3 === 1
          ? 'tone-match'
          : 'multiple-choice';

        if (type === 'multiple-choice') {
          const distractors = shuffleArray(
            allEnglish.filter((e: string) => e !== phrase.english),
          ).slice(0, 3);
          return {
            id: phrase.id,
            type,
            yoruba: phrase.yoruba,
            pronunciation: phrase.pronunciation,
            options: shuffleArray([phrase.english, ...distractors]),
            correct: phrase.english,
          };
        }

        if (type === 'fill-blank') {
          const distractors = shuffleArray(
            allYoruba.filter((y: string) => y !== phrase.yoruba),
          ).slice(0, 3);
          return {
            id: phrase.id,
            type,
            english: phrase.english,
            options: shuffleArray([phrase.yoruba, ...distractors]),
            correct: phrase.yoruba,
          };
        }

        // tone-match
        const distractors = shuffleArray(
          allYoruba.filter((y: string) => y !== phrase.yoruba),
        ).slice(0, 3);
        return {
          id: phrase.id,
          type,
          yoruba: phrase.yoruba,
          pronunciation: phrase.pronunciation,
          english: phrase.english,
          options: shuffleArray([phrase.pronunciation, ...distractors.map(() => mutateTone(phrase.pronunciation))]),
          correct: phrase.pronunciation,
        };
      });

    res.json({ lessonId, questions });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /quiz/submit — grade quiz, save attempt, award XP
router.post('/submit', requireAuth, async (req: Request, res: Response) => {
  const uid = (req as any).uid as string;
  const { lessonId, questions, answers } = req.body as {
    lessonId: string;
    questions: QuizQuestion[];
    answers: Record<string, string>;
  };

  if (!lessonId || !questions || !answers) {
    res.status(400).json({ error: 'lessonId, questions and answers required' });
    return;
  }

  // Grade
  let correct = 0;
  for (const q of questions) {
    if (answers[q.id]?.trim() === q.correct?.trim()) correct++;
  }
  const score = Math.round((correct / questions.length) * 100);
  const xpEarned = Math.round(score / 2); // up to 50 XP per quiz

  const attempt = {
    lessonId,
    questions,
    answers,
    score,
    completedAt: new Date().toISOString(),
  };

  await db
    .collection('quizAttempts')
    .doc(uid)
    .collection('sessions')
    .add(attempt);

  const { leveledUp, newLevel, totalPoints } = await awardXP(uid, xpEarned);

  Promise.all([
    progressMissions(uid, 'complete_quiz'),
    evaluateAchievements(uid),
  ]).catch((e) => console.error('Quiz side-effects error:', e));

  res.json({ score, correct, total: questions.length, xpEarned, leveledUp, newLevel, totalPoints });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Produce a slightly wrong tone-mark variant as a distractor
function mutateTone(pron: string): string {
  const toneMap: Record<string, string> = { à: 'á', á: 'à', è: 'é', é: 'è', ì: 'í', í: 'ì' };
  return pron.replace(/[àáèéìí]/g, (c) => toneMap[c] ?? c);
}

export default router;
