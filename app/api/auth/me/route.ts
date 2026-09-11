import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { ROLE_PERMISSIONS, UserRole } from '@/lib/auth/permissions';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      );
    }

    const permissions = ROLE_PERMISSIONS[user.role as UserRole] || [];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        permissions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user session' },
      { status: 500 }
    );
  }
}
