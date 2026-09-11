import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/passwords';

export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const { name, currentPassword, newPassword, confirmPassword } = body;

    const updateData: any = {};

    // 1. Update Full Name
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    // 2. Change Password
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: 'Please provide current password, new password, and confirm password.' },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: 'New password and confirmation password do not match.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      // Fetch user password hash
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      const isValidCurrent = await verifyPassword(
        currentPassword,
        dbUser.passwordHash
      );

      if (!isValidCurrent) {
        return NextResponse.json(
          { error: 'Current password is incorrect.' },
          { status: 400 }
        );
      }

      if (await verifyPassword(newPassword, dbUser.passwordHash)) {
        return NextResponse.json(
          { error: 'New password cannot be the same as your current password.' },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields provided for update.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
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
        userId: user.id,
        userName: updatedUser.name,
        activityType: 'PROFILE_UPDATED',
        description: `User ${updatedUser.name} updated their profile settings.`,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully.',
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return NextResponse.json(
      { error: 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
