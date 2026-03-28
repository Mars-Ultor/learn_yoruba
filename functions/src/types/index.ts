// Augment Express Request with uid from auth middleware
declare global {
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  streak: number;
  totalPoints: number;
  level: number;
  xpToNextLevel: number;
  lastActiveDate?: string;
  onboardingComplete: boolean;
  weakAreas: string[];
  strongAreas: string[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: 'conversation' | 'vocabulary' | 'grammar' | 'listening';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  phrases: Phrase[];
  prerequisiteId?: string;
  minimumScoreToUnlock: number;
}

export interface Phrase {
  id: string;
  yoruba: string;
  pronunciation: string;
  english: string;
  audioUrl?: string;
  context?: string;
}

export interface Vocabulary {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  type: 'greetings' | 'nouns' | 'verbs' | 'proverbs' | 'adjectives' | 'adverbs' | 'numbers' | 'expressions';
  examples: string[];
  audioUrl?: string;
  difficultyScore?: number;
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  completed: boolean;
  score: number;
  attempts: number;
  lastAttemptDate: string;
}

export interface DailyGoal {
  userId: string;
  date: string;
  targetMinutes: number;
  completedMinutes: number;
  targetLessons: number;
  completedLessons: number;
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export type MissionType = 'daily' | 'weekly' | 'milestone';

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  criteria: { action: string; target: number };
  reward: { xp: number; badge?: string };
  expiresAt?: string;
}

export interface UserMission {
  missionId: string;
  progress: number;
  completed: boolean;
  claimedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  trigger: string;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
}

// XP required to reach each level (index = level)
export const XP_THRESHOLDS = [0, 0, 500, 1200, 2200, 3500, 5200, 7200, 9800, 13000, 17000];

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export type QuestionType = 'multiple-choice' | 'fill-blank' | 'tone-match';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  yoruba?: string;
  english?: string;
  pronunciation?: string;
  options?: string[];
  correct: string;
}

export interface QuizAttempt {
  lessonId: string;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  score: number;
  completedAt: string;
}

// ─── Reading Comprehension ────────────────────────────────────────────────────

export interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
}

export interface ReadingExercise {
  id: string;
  title: string;
  passage: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: ReadingQuestion[];
}

// ─── Writing Practice ─────────────────────────────────────────────────────────

export interface WritingSubmission {
  id?: string;
  userId: string;
  prompt: string;
  response: string;
  feedback?: string;
  score?: number;
  submittedAt: string;
}

// ─── Daily Tasks ──────────────────────────────────────────────────────────────

export type TaskType = 'lesson' | 'flashcard' | 'quiz' | 'reading' | 'writing' | 'conversation';

export interface DailyTask {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  referenceId?: string;
}

// ─── Conversations ────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface ConversationSession {
  id?: string;
  topic: string;
  messages: ConversationMessage[];
  startedAt: string;
  endedAt?: string;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export type LearningStyle = 'standard' | 'intensive' | 'story' | 'immersion';

export interface OnboardingData {
  learningStyle: LearningStyle;
  dailyGoalMinutes: number;
  completed: boolean;
  completedAt: string;
}
