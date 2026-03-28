import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/firebase';

/**
 * Verifies the Firebase ID token in the Authorization header.
 * Attaches `req.uid` (the verified UID) so downstream handlers can trust it.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);
  try {
    const decoded = await auth.verifyIdToken(token);
    (req as any).uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
