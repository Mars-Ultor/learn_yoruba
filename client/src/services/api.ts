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
  getAll: () => api.get('/lessons'),
  getById: (id: string) => api.get(`/lessons/${id}`),
  getByDifficulty: (level: string) => api.get(`/lessons/difficulty/${level}`),
  getByCategory: (category: string) => api.get(`/lessons/category/${category}`),
};

// Vocabulary API
export const vocabularyApi = {
  getAll: () => api.get('/vocabulary'),
  getById: (id: string) => api.get(`/vocabulary/${id}`),
  getByType: (type: string) => api.get(`/vocabulary/type/${type}`),
};

// Users API
export const usersApi = {
  getProfile: (id: string) => api.get(`/users/${id}`),
  register: (data: { uid: string; email: string; username: string }) =>
    api.post('/users/register', data),
};

// Progress API
export const progressApi = {
  getUserProgress: (userId: string) => api.get(`/progress/user/${userId}`),
  updateProgress: (data: {
    userId: string;
    lessonId: string;
    score: number;
  }) => api.post('/progress', data),
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

export default api;
