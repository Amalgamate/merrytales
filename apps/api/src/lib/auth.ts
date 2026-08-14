import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { config } from '../config';
import type { AuthUser } from '../types';

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export function signAccessToken(user: AuthUser): string {
  return jwt.sign({ email: user.email, role: user.role }, config.JWT_SECRET, {
    subject: user.id,
    expiresIn: '15m',
    issuer: 'merry-tales-api',
    audience: 'merry-tales-web',
  });
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, config.JWT_SECRET, {
    issuer: 'merry-tales-api',
    audience: 'merry-tales-web',
  });
  if (typeof payload === 'string' || !payload.sub || !payload.email || !payload.role) {
    throw new Error('Invalid token payload');
  }
  return { id: payload.sub, email: String(payload.email), role: payload.role as UserRole };
}
