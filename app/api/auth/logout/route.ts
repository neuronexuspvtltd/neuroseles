import { NextResponse } from 'next/server';
import { getCurrentUser, invalidateSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (user) {
      await prisma.activity.create({
        data: {
          userId: user.id,
          userName: user.name,
          activityType: 'USER_LOGGED_OUT',
          description: `User ${user.name} logged out.`,
        },
      });
    }

    await invalidateSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to log out.' },
      { status: 500 }
    );
  }
}
