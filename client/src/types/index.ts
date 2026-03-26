export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: 'conversation' | 'vocabulary' | 'grammar' | 'listening';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  phrases: Phrase[];
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
}

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

