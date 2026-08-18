import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import type { UserRole, UserStatus } from '@prisma/client';
import { config } from '../config';
import type { AuthUser } from '../types';

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    { email: user.email, role: user.role, st: user.status, mcp: user.mustChangePassword ? 1 : 0 },
    config.JWT_SECRET,
    { subject: user.id, expiresIn: '15m', issuer: 'merry-tales-api', audience: 'merry-tales-web' },
  );
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, config.JWT_SECRET, {
    issuer: 'merry-tales-api',
    audience: 'merry-tales-web',
  });
  if (typeof payload === 'string' || !payload.sub || !payload.email || !payload.role) {
    throw new Error('Invalid token payload');
  }
  return {
    id: payload.sub,
    email: String(payload.email),
    role: payload.role as UserRole,
    status: (payload.st as UserStatus) ?? 'ACTIVE',
    mustChangePassword: payload.mcp === 1,
  };
}

export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({}, config.JWT_SECRET, {
    subject: userId,
    expiresIn: '30d',
    issuer: 'merry-tales-api',
    audience: 'merry-tales-web',
  });
}

export function verifyRefreshToken(token: string): { userId: string } {
  const payload = jwt.verify(token, config.JWT_SECRET, {
    issuer: 'merry-tales-api',
    audience: 'merry-tales-web',
  });
  if (typeof payload === 'string' || !payload.sub) throw new Error('Invalid refresh token');
  return { userId: payload.sub };
}
