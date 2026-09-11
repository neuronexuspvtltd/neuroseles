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

    // Check Client table first
    const existingClient = await prisma.client.findUnique({
      where: { normalizedMobile: normMobile },
      select: { id: true, name: true, mobile: true, leadId: true },
    });

    if (existingClient) {
      return NextResponse.json({
        exists: true,
        type: 'CLIENT',
        id: existingClient.id,
        name: existingClient.name,
        mobile: existingClient.mobile,
        leadId: existingClient.leadId,
        message: 'This mobile number already exists as an active client.',
      });
    }

    // Check Lead table
    const existingLead = await prisma.lead.findUnique({
      where: { normalizedMobile: normMobile },
      select: { id: true, name: true, mobile: true, status: true },
    });

    if (existingLead) {
      return NextResponse.json({
        exists: true,
        type: 'LEAD',
        id: existingLead.id,
        name: existingLead.name,
        mobile: existingLead.mobile,
        status: existingLead.status,
        message: 'This mobile number already exists as a lead.',
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error: any) {
    console.error('Error checking client mobile:', error);
    return NextResponse.json({ error: 'Failed to check mobile number' }, { status: 500 });
  }
}
