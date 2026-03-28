export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: 'conversation' | 'vocabulary' | 'grammar' | 'listening';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  phrases: Phrase[];
  prerequisiteId?: string;
  minimumScoreToUnlock?: number;
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
}

export interface UserProgress {
  userId: string;
  lessonId: string;
  completed: boolean;
  score: number;
  attempts: number;
  lastAttemptDate: Date;
}

export interface User {
  id: string;
  email: string;
  username: string;
  streak: number;
  totalPoints: number;
  level: number;
  xpToNextLevel: number;
  lastActiveDate?: string;
  onboardingComplete: boolean;
  weakAreas: string[];
  strongAreas: string[];
}

export const XP_THRESHOLDS = [0, 0, 500, 1200, 2200, 3500, 5200, 7200, 9800, 13000, 17000];

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
  mission?: Mission;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  trigger: string;
  unlockedAt?: string;
}

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

export interface WritingSubmission {
  id?: string;
  prompt: string;
  response: string;
  feedback?: string;
  score?: number;
  submittedAt: string;
}

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

export type MessageRole = 'user' | 'assistant';

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

export interface ConversationSession {
  id?: string;
  topic: string;
  messages: ConversationMessage[];
  startedAt: string;
  endedAt?: string;
  summary?: string;
  messageCount?: number;
}

export type LearningStyleOption = 'standard' | 'intensive' | 'story' | 'immersion';

export interface DailyGoal {
  userId: string;
  date: Date;
  targetMinutes: number;
  completedMinutes: number;
  targetLessons: number;
  completedLessons: number;
}

// ─── Learning Schedule ────────────────────────────────────────────────────────

export interface LearningSchedule {
  id: string;
  userId: string;
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  startTime: string; // "HH:MM"
  duration: number;  // minutes
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── User Settings ────────────────────────────────────────────────────────────

export type LearningStyle = 'standard' | 'intensive' | 'story' | 'immersion';

export interface UserSettings {
  id: string;
  userId: string;
  learningStyle: LearningStyle;
  flashcardMode: boolean;
  shadowingMode: boolean;
  mnemonicMode: boolean;
  storyMode: boolean;
  dailyReminders: boolean;
  updatedAt: string;
}

// ─── Flashcard / SRS ─────────────────────────────────────────────────────────

export type FlashcardQuality = 0 | 1 | 2 | 3; // Again | Hard | Good | Easy

export interface FlashcardReview {
  id: string;
  userId: string;
  vocabularyId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview: string;
  vocabulary: Vocabulary;
}

