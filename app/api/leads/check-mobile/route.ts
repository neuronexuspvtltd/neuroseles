import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    const normMobile = normalizePhoneNumber(mobile);
    if (!normMobile) {
      return NextResponse.json({ exists: false });
    }

    const existingLead = await prisma.lead.findUnique({
      where: { normalizedMobile: normMobile },
      select: { id: true, name: true, mobile: true },
    });

    if (existingLead) {
      return NextResponse.json({
        exists: true,
        leadId: existingLead.id,
        leadName: existingLead.name,
        mobile: existingLead.mobile,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error: any) {
    console.error('Error checking mobile:', error);
    return NextResponse.json({ error: 'Failed to check mobile number' }, { status: 500 });
  }
}
