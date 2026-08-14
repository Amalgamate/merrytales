import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../lib/auth';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in is required.' } });
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Your session is invalid or expired.' } });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this resource.' } });
    }
    next();
  };
}
