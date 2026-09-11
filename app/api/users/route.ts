import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/passwords';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth('users.view');
    if (error) return error;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('Fetch users error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch users.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: currentUser, error } = await requireAuth('users.create');
    if (error) return error;

    const body = await req.json();
    const { name, email, password, role, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const validRoles = ['ADMIN', 'MANAGER', 'SALES_STAFF'];
    const validStatuses = ['ACTIVE', 'INACTIVE'];

    const userRole = validRoles.includes(role) ? role : 'SALES_STAFF';
    const userStatus = validStatuses.includes(status) ? status : 'ACTIVE';

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: userRole,
        status: userStatus,
      },
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

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.name,
        activityType: 'USER_CREATED',
        description: `Created new user ${newUser.name} (${newUser.email}) with role ${newUser.role}.`,
      },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully.',
    });
  } catch (err: any) {
    console.error('Create user error:', err);
    return NextResponse.json(
      { error: 'Failed to create user.' },
      { status: 500 }
    );
  }
}
