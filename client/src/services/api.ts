import axios from 'axios';
import { auth } from '../lib/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Firebase auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lessons API
export const lessonsApi = {
  getAll: (page = 1, limit = 20) => api.get(`/lessons?page=${page}&limit=${limit}`),
  getById: (id: string) => api.get(`/lessons/${id}`),
  getByDifficulty: (level: string) => api.get(`/lessons/difficulty/${level}`),
  getByCategory: (category: string) => api.get(`/lessons/category/${category}`),
  getUnlocked: () => api.get('/lessons/unlocked'),
};

// Vocabulary API
export const vocabularyApi = {
  getAll: (page = 1, limit = 20) => api.get(`/vocabulary?page=${page}&limit=${limit}`),
  getById: (id: string) => api.get(`/vocabulary/${id}`),
  getByType: (type: string) => api.get(`/vocabulary/type/${type}`),
};

// Users API
export const usersApi = {
  getProfile: (id: string) => api.get(`/users/${id}`),
  register: (data: { uid: string; email: string; username: string }) =>
    api.post('/users/register', data),
  checkIn: () => api.post('/users/check-in'),
};

// Progress API
export const progressApi = {
  getUserProgress: (userId: string) => api.get(`/progress/user/${userId}`),
  updateProgress: (data: { userId: string; lessonId: string; score: number }) =>
    api.post('/progress', data),
  getDailyGoals: (userId: string) => api.get(`/progress/goals/${userId}`),
  updateDailyGoals: (data: {
    userId: string;
    completedMinutes: number;
    completedLessons: number;
  }) => api.post('/progress/goals', data),
};

// Schedule API
export const scheduleApi = {
  getByUser: (userId: string) => api.get(`/schedule/user/${userId}`),
  create: (data: { userId: string; dayOfWeek: number; startTime: string; duration?: number }) =>
    api.post('/schedule', data),
  update: (id: string, data: { dayOfWeek?: number; startTime?: string; duration?: number; active?: boolean }) =>
    api.put(`/schedule/${id}`, data),
  remove: (id: string) => api.delete(`/schedule/${id}`),
};

// Settings API
export const settingsApi = {
  getByUser: (userId: string) => api.get(`/settings/user/${userId}`),
  update: (
    userId: string,
    data: Partial<{
      learningStyle: string;
      flashcardMode: boolean;
      shadowingMode: boolean;
      mnemonicMode: boolean;
      storyMode: boolean;
      dailyReminders: boolean;
    }>,
  ) => api.put(`/settings/user/${userId}`, data),
};

// Flashcards API
export const flashcardsApi = {
  getDue: (userId: string) => api.get(`/flashcards/user/${userId}/due`),
  getAll: (userId: string) => api.get(`/flashcards/user/${userId}/all`),
  init: (userId: string) => api.post(`/flashcards/user/${userId}/init`),
  review: (data: { userId: string; vocabularyId: string; quality: number }) =>
    api.post('/flashcards/review', data),
};

// Missions API
export const missionsApi = {
  getActive: () => api.get('/missions/active'),
  claim: (userMissionId: string) => api.post('/missions/claim', { userMissionId }),
};

// Achievements API
export const achievementsApi = {
  getAll: () => api.get('/achievements'),
};

// Quiz API
export const quizApi = {
  generate: (lessonId: string) => api.post('/quiz/generate', { lessonId }),
  submit: (data: {
    lessonId: string;
    questions: any[];
    answers: Record<string, string>;
  }) => api.post('/quiz/submit', data),
};

// Reading API
export const readingApi = {
  getAll: (page = 1, difficulty?: string) =>
    api.get(`/reading?page=${page}${difficulty ? `&difficulty=${difficulty}` : ''}`),
  getById: (id: string) => api.get(`/reading/${id}`),
  submit: (id: string, answers: Record<string, string>) =>
    api.post(`/reading/${id}/submit`, { answers }),
};

// Writing API
export const writingApi = {
  getPrompt: () => api.get('/writing/prompt'),
  submit: (data: { prompt: string; response: string }) => api.post('/writing/submit', data),
  getHistory: () => api.get('/writing/history'),
};

// Tasks API
export const tasksApi = {
  getDaily: () => api.get('/tasks/daily'),
  completeTask: (taskId: string, increment = 1) =>
    api.post('/tasks/daily/complete', { taskId, increment }),
};

// AI API
export const aiApi = {
  sendTutorMessage: (message: string, history: Array<{ role: string; content: string }>) =>
    api.post('/ai/tutor', { message, history }),
  startConversation: (topic: string) => api.post('/ai/conversation/start', { topic }),
  sendConversationMessage: (sessionId: string, message: string) =>
    api.post('/ai/conversation/message', { sessionId, message }),
  endConversation: (sessionId: string) => api.post('/ai/conversation/end', { sessionId }),
  getConversationSessions: () => api.get('/ai/conversation/sessions'),
};

// Dashboard API
export const dashboardApi = {
  getRecs: () => api.get('/dashboard/recs'),
};

// Onboarding API
export const onboardingApi = {
  getStatus: () => api.get('/onboarding/status'),
  complete: (data: { learningStyle: string; dailyGoalMinutes: number }) =>
    api.post('/onboarding/complete', data),
};

export default api;
