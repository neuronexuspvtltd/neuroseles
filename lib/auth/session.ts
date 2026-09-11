import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { prisma, ensureDatabaseTables } from '@/lib/prisma';
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

export async function createSession(
  user: { id: string; email: string; role: string; name?: string },
  response?: NextResponse
) {
  // Create JWT token valid for 7 days
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name || user.email.split('@')[0],
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET_KEY);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Store in Database Session table (safely caught for serverless environments)
  try {
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });
  } catch (dbErr) {
    console.warn('[Session DB Warning] Could not persist session record to DB:', dbErr);
  }

  // Attach directly to response if provided
  if (response) {
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  }

  // Set HTTP-only Cookie in cookieStore
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  } catch (e) {}

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
    const email = payload.email as string;
    const role = payload.role as string;
    const name = (payload.name as string) || email?.split('@')[0] || 'User';

    if (!userId || !email) {
      return null;
    }

    // Attempt DB user lookup, fallback to JWT payload for serverless/ephemeral environments
    try {
      await ensureDatabaseTables();
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

      if (user) {
        if (user.status !== 'ACTIVE') return null;
        return user;
      }
    } catch (dbErr) {
      console.warn('[Session DB Lookup Warning]:', dbErr);
    }

    // Fallback user constructed from verified JWT payload for Serverless / Ephemeral DB environments
    return {
      id: userId,
      name,
      email,
      role: role || 'ADMIN',
      status: 'ACTIVE',
      lastLoginAt: new Date(),
      createdAt: new Date(),
    };
  } catch (error) {
    return null;
  }
}

export async function invalidateSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      try {
        await prisma.session.deleteMany({
          where: { token },
        });
      } catch (e) {}
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
