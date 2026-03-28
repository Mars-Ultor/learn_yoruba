// Node.js 22 runtime
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import lessonRoutes from './routes/lessons';
import userRoutes from './routes/users';
import progressRoutes from './routes/progress';
import vocabularyRoutes from './routes/vocabulary';
import missionsRoutes from './routes/missions';
import achievementsRoutes from './routes/achievements';
import quizRoutes from './routes/quiz';
import readingRoutes from './routes/reading';
import writingRoutes from './routes/writing';
import tasksRoutes from './routes/tasks';
import aiRoutes from './routes/ai';
import dashboardRoutes from './routes/dashboard';
import onboardingRoutes from './routes/onboarding';
import settingsRoutes from './routes/settings';
import flashcardsRoutes from './routes/flashcards';
import scheduleRoutes from './routes/schedule';
import migrateRoutes from './routes/migrate';

const app: Application = express();

// Restrict CORS to known origins; allow all in development
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : true; // open during local emulator development
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/lessons', lessonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/migrate', migrateRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Yoruba Learning App API is running' });
});

// Export as Firebase Cloud Function
export const api = onRequest({ invoker: 'public', secrets: ['ANTHROPIC_API_KEY'] }, app);
