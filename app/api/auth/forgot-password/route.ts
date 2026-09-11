import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Standard security practice: Always return same response message to prevent email enumeration
    const genericSuccessMessage =
      'If an account exists with that email, a password reset link has been generated.';

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({
        success: true,
        message: genericSuccessMessage,
      });
    }

    // Generate 32-byte secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    // Store token in DB
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${resetToken}`;
    console.log(`[PASSWORD RESET LINK FOR ${user.email}]: ${resetUrl}`);

    return NextResponse.json({
      success: true,
      message: genericSuccessMessage,
      // For local development accessibility when SMTP is not configured:
      devResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
