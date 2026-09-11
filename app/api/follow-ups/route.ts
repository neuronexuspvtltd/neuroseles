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

    let allPending: any[] = [];
    let todayFollowUps: any[] = [];
    let upcomingFollowUps: any[] = [];
    let overdueFollowUps: any[] = [];

    try {
      const res = await Promise.all([
        prisma.followUp.findMany({
          where: { status: 'PENDING' },
          include: { lead: true },
          orderBy: [{ followUpDate: 'asc' }, { followUpTime: 'asc' }],
        }),
        prisma.followUp.findMany({
          where: {
            followUpDate: todayStr,
            status: 'PENDING',
          },
          include: { lead: true },
          orderBy: { followUpTime: 'asc' },
        }),
        prisma.followUp.findMany({
          where: {
            followUpDate: { gt: todayStr },
            status: 'PENDING',
          },
          include: { lead: true },
          orderBy: [{ followUpDate: 'asc' }, { followUpTime: 'asc' }],
        }),
        prisma.followUp.findMany({
          where: {
            followUpDate: { lt: todayStr },
            status: 'PENDING',
          },
          include: { lead: true },
          orderBy: [{ followUpDate: 'asc' }, { followUpTime: 'asc' }],
        }),
      ]);
      allPending = res[0];
      todayFollowUps = res[1];
      upcomingFollowUps = res[2];
      overdueFollowUps = res[3];
    } catch (dbErr) {
      console.warn('[GET FollowUps DB Error - Fallback to Firestore]:', dbErr);
    }

    if (allPending.length === 0) {
      const { getFirestoreDocs } = await import('@/lib/firebase/firestore');
      const fsFollowUps = await getFirestoreDocs('followups');
      if (fsFollowUps && fsFollowUps.length > 0) {
        const pendingDocs = fsFollowUps
          .filter((f) => f.status === 'PENDING')
          .map((f) => ({
            ...f,
            lead: f.lead || { name: 'Lead', mobile: '' },
          }));
        allPending = pendingDocs;
        todayFollowUps = pendingDocs.filter((f) => f.followUpDate === todayStr);
        upcomingFollowUps = pendingDocs.filter((f) => f.followUpDate > todayStr);
        overdueFollowUps = pendingDocs.filter((f) => f.followUpDate < todayStr);
      }
    }

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
