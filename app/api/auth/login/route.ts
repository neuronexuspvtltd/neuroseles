import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth/passwords';
import { createSession } from '@/lib/auth/session';

async function autoSeedDefaultAccounts() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log('[Auto-Seed] Seeding initial default CRM accounts...');
      const adminHash = await hashPassword('Admin@123456');
      const managerHash = await hashPassword('Manager@123456');
      const salesHash = await hashPassword('Sales@123456');

      await prisma.user.createMany({
        data: [
          {
            name: 'System Administrator',
            email: 'admin@neurosales.com',
            passwordHash: adminHash,
            role: 'ADMIN',
            status: 'ACTIVE',
          },
          {
            name: 'Sales Manager',
            email: 'manager@neurosales.com',
            passwordHash: managerHash,
            role: 'MANAGER',
            status: 'ACTIVE',
          },
          {
            name: 'Sales Executive',
            email: 'sales@neurosales.com',
            passwordHash: salesHash,
            role: 'SALES_STAFF',
            status: 'ACTIVE',
          },
        ],
      });
      console.log('[Auto-Seed] Initial accounts seeded successfully!');
    }
  } catch (err) {
    console.error('[Auto-Seed Error]:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Ensure initial accounts exist in fresh database deployments
    await autoSeedDefaultAccounts();

    // Find User
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is inactive. Please contact an administrator.' },
        { status: 403 }
      );
    }

    // Verify Password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Create session cookie & DB record
    await createSession(user.id);

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log Activity
    try {
      await prisma.activity.create({
        data: {
          userId: user.id,
          userName: user.name,
          activityType: 'USER_LOGGED_IN',
          description: `User ${user.name} logged in successfully.`,
        },
      });
    } catch (actErr) {
      console.warn('Activity log error:', actErr);
    }

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}

