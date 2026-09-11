import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, firebaseUid } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required for Firebase authentication.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Auto-provision user account from Firebase Auth
      user = await prisma.user.create({
        data: {
          name: name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          passwordHash: 'FIREBASE_AUTH_USER',
          role: 'SALES_STAFF',
          status: 'ACTIVE',
        },
      });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is inactive. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Create CRM session
    await createSession(user.id);

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        userName: user.name,
        activityType: 'USER_LOGGED_IN',
        description: `User ${user.name} logged in via Firebase Authentication.`,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Firebase login handler error:', error);
    return NextResponse.json(
      { error: 'Failed to process Firebase authentication.' },
      { status: 500 }
    );
  }
}
