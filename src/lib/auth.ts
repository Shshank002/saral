// Authentication helpers for SARAL
// Custom session-based auth (no external library needed)
// Sessions stored in PostgreSQL, tokens in httpOnly cookies

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

// Session lasts 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = 'saral_session';

// ===== Password helpers =====
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// ===== Token generation =====
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ===== Validation helpers =====
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateSignupInput(email: string, password: string, channelName: string): string | null {
  if (!email || !isValidEmail(email)) return 'Valid email is required';
  if (!password || password.length < 6) return 'Password must be at least 6 characters';
  if (!channelName || channelName.trim().length < 2) return 'Channel name must be at least 2 characters';
  if (channelName.length > 50) return 'Channel name too long (max 50 chars)';
  return null;
}

// ===== Cookie helpers =====
export function setSessionCookie(res: NextApiResponse, token: string) {
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${SESSION_DURATION_MS / 1000}`,
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') {
    cookie.push('Secure');
  }
  res.setHeader('Set-Cookie', cookie.join('; '));
}

export function clearSessionCookie(res: NextApiResponse) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
  return cookies[COOKIE_NAME] || null;
}

// ===== Signup =====
export async function signup(input: {
  email: string;
  password: string;
  channelName: string;
}) {
  // Check email uniqueness
  const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingEmail) {
    throw new AuthError('This email is already registered. Try logging in.', 409);
  }

  // Check channel name uniqueness
  const existingChannel = await prisma.user.findUnique({ where: { channelName: input.channelName } });
  if (existingChannel) {
    throw new AuthError('Channel name is taken. Pick another.', 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      channelName: input.channelName,
      displayName: input.channelName,
    },
  });

  // Create session
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({
    data: { userId: user.id, token, expiresAt },
  });

  return { user, token };
}

// ===== Login =====
export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash) {
    throw new AuthError('Invalid email or password', 401);
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError('Invalid email or password', 401);
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({
    data: { userId: user.id, token, expiresAt },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { user, token };
}

// ===== Logout =====
export async function logout(token: string) {
  try {
    await prisma.session.delete({ where: { token } });
  } catch {
    // Session may not exist, ignore
  }
}

// ===== Get current user from request =====
export async function getCurrentUser(req: NextApiRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // Expired - clean up
    await prisma.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return session.user;
}

// ===== Require auth (use in API routes) =====
export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: 'You must be logged in' });
    return null;
  }
  return user;
}

// ===== Custom error =====
export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
