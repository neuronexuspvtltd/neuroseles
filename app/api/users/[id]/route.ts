import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/passwords';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: currentUser, error } = await requireAuth('users.edit');
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const { name, email, role, status, newPassword } = body;

    // Check existing target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Guard against deactivating or demoting the last active Admin
    const isDemotingOrDeactivatingAdmin =
      targetUser.role === 'ADMIN' &&
      ((role && role !== 'ADMIN') || (status && status === 'INACTIVE'));

    if (isDemotingOrDeactivatingAdmin) {
      const otherActiveAdminsCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          status: 'ACTIVE',
          id: { not: id },
        },
      });

      if (otherActiveAdminsCount === 0) {
        return NextResponse.json(
          {
            error:
              'Cannot deactivate or demote the last remaining active administrator.',
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== targetUser.email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (existingEmail) {
          return NextResponse.json(
            { error: 'A user with this email address already exists.' },
            { status: 400 }
          );
        }
        updateData.email = normalizedEmail;
      }
    }

    if (role && ['ADMIN', 'MANAGER', 'SALES_STAFF'].includes(role)) {
      updateData.role = role;
    }

    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
      updateData.status = status;
      // Invalidate active sessions if user is set to INACTIVE
      if (status === 'INACTIVE') {
        await prisma.session.deleteMany({
          where: { userId: id },
        });
      }
    }

    if (newPassword && newPassword.length >= 6) {
      updateData.passwordHash = await hashPassword(newPassword);
      // Invalidate existing sessions on forced password change
      await prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
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
        userId: currentUser.id,
        userName: currentUser.name,
        activityType: 'USER_UPDATED',
        description: `Updated user ${updatedUser.name} (${updatedUser.email}) settings.`,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully.',
    });
  } catch (err: any) {
    console.error('Update user error:', err);
    return NextResponse.json(
      { error: 'Failed to update user.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: currentUser, error } = await requireAuth('users.delete');
    if (error) return error;

    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Check if target is last active admin
    if (targetUser.role === 'ADMIN') {
      const otherActiveAdminsCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          status: 'ACTIVE',
          id: { not: id },
        },
      });

      if (otherActiveAdminsCount === 0) {
        return NextResponse.json(
          {
            error:
              'Cannot delete or deactivate the last remaining active administrator.',
          },
          { status: 400 }
        );
      }
    }

    // Deactivate user instead of hard deleting to preserve historical activity records
    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    // Invalidate sessions
    await prisma.session.deleteMany({
      where: { userId: id },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.name,
        activityType: 'USER_DEACTIVATED',
        description: `Deactivated user ${targetUser.name} (${targetUser.email}).`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully while preserving historical activity records.',
    });
  } catch (err: any) {
    console.error('Deactivate user error:', err);
    return NextResponse.json(
      { error: 'Failed to deactivate user.' },
      { status: 500 }
    );
  }
}
