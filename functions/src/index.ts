import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import lessonRoutes from './routes/lessons';
import userRoutes from './routes/users';
import progressRoutes from './routes/progress';
import vocabularyRoutes from './routes/vocabulary';

const app: Application = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/lessons', lessonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/vocabulary', vocabularyRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Yoruba Learning App API is running' });
});

// Export as Firebase Cloud Function
export const api = onRequest({ invoker: 'public' }, app);
