import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/users/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/users/login', data),
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

export default api;
