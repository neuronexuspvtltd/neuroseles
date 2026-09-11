import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseTables } from '@/lib/prisma';
import { format } from 'date-fns';
import { syncToFirestore } from '@/lib/firebase/firestore';
import { hydrateFollowUps } from '@/lib/firebase/hydration';

export async function GET(req: Request) {
  try {
    await ensureDatabaseTables();
    await hydrateFollowUps();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const [allPending, todayFollowUps, upcomingFollowUps, overdueFollowUps] = await Promise.all([
      // All pending
      prisma.followUp.findMany({
        where: { status: 'PENDING' },
        include: { lead: true },
        orderBy: [{ followUpDate: 'asc' }, { followUpTime: 'asc' }],
      }),
      // Today
      prisma.followUp.findMany({
        where: {
          followUpDate: todayStr,
          status: 'PENDING',
        },
        include: { lead: true },
        orderBy: { followUpTime: 'asc' },
      }),
      // Upcoming
      prisma.followUp.findMany({
        where: {
          followUpDate: { gt: todayStr },
          status: 'PENDING',
        },
        include: { lead: true },
        orderBy: [{ followUpDate: 'asc' }, { followUpTime: 'asc' }],
      }),
      // Overdue
      prisma.followUp.findMany({
        where: {
          followUpDate: { lt: todayStr },
          status: 'PENDING',
        },
        include: { lead: true },
        orderBy: [{ followUpDate: 'asc' }, { followUpTime: 'asc' }],
      }),
    ]);

    return NextResponse.json({
      todayStr,
      todayFollowUps,
      upcomingFollowUps,
      overdueFollowUps,
      allPending,
    });
  } catch (error: any) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseTables();
    const body = await req.json();
    const { leadId, followUpDate, followUpTime, note, reminderEnabled = true } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }
    if (!followUpDate) {
      return NextResponse.json({ error: 'Follow-up Date is required' }, { status: 400 });
    }
    if (!followUpTime) {
      return NextResponse.json({ error: 'Follow-up Time is required' }, { status: 400 });
    }
    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Follow-up Note is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const [newFollowUp, updatedLead] = await prisma.$transaction([
      prisma.followUp.create({
        data: {
          leadId,
          followUpDate,
          followUpTime,
          note: note.trim(),
          reminderEnabled: Boolean(reminderEnabled),
          status: 'PENDING',
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'FOLLOW_UP',
          activities: {
            create: [
              {
                activityType: 'FOLLOW_UP_SCHEDULED',
                description: `Follow-up Scheduled for ${followUpDate} at ${followUpTime} - Note: ${note.trim()}`,
              },
            ],
          },
        },
      }),
    ]);

    syncToFirestore('followups', newFollowUp.id, newFollowUp).catch(console.warn);

    return NextResponse.json({
      followUp: newFollowUp,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error('Error scheduling follow-up:', error);
    return NextResponse.json({ error: 'Failed to schedule follow-up' }, { status: 500 });
  }
}
