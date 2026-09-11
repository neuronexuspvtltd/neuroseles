import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { Permission, hasPermission } from './permissions';

const COOKIE_NAME = 'crm_session';
const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'neurosales-crm-super-secret-jwt-key-2026'
);

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export async function createSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('User is inactive or does not exist');
  }

  // Create JWT token valid for 7 days
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET_KEY);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Store in Database Session table for stateful invalidation capability
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Set HTTP-only Cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // Verify JWT payload
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    const userId = payload.userId as string;

    if (!userId) {
      return null;
    }

    // Verify DB Session exists & not expired
    const dbSession = await prisma.session.findUnique({
      where: { token },
    });

    if (!dbSession || dbSession.expiresAt < new Date()) {
      return null;
    }

    // Verify User in DB & status ACTIVE
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function invalidateSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    cookieStore.delete(COOKIE_NAME);
  } catch (error) {
    console.error('Error invalidating session:', error);
  }
}

export async function requireAuth(permission?: Permission): Promise<
  | { user: AuthUser; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Please log in to continue.' },
        { status: 401 }
      ),
    };
  }

  if (permission && !hasPermission(user, permission)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "You don't have permission to perform this action." },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}
