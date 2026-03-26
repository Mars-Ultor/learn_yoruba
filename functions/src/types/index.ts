export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  streak: number;
  totalPoints: number;
  level: number;
}

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
