import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { db } from '../db';
import { verifyAccessToken } from '../lib/auth';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in is required.' } });
  }
  try {
    const tokenUser = verifyAccessToken(token);
    const user = await db.user.findUnique({
      where: { id: tokenUser.id },
      select: { status: true, mustChangePassword: true },
    });
    if (!user) {
      return res.status(401).json({ error: { code: 'USER_NOT_FOUND', message: 'Your account is no longer available.' } });
    }
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: { code: 'ACCOUNT_UNAVAILABLE', message: 'This account is not currently active.' } });
    }
    const passwordChangeRequest = req.originalUrl.startsWith('/api/auth/change-password') || req.originalUrl.startsWith('/api/auth/me');
    if (user.mustChangePassword && !passwordChangeRequest) {
      return res.status(403).json({ error: { code: 'PASSWORD_CHANGE_REQUIRED', message: 'Set a new password before continuing.' } });
    }
    req.user = tokenUser;
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
