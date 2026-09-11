import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseTables } from '@/lib/prisma';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { syncToFirestore } from '@/lib/firebase/firestore';
import { hydrateDemos } from '@/lib/firebase/hydration';

export async function GET(req: Request) {
  try {
    await ensureDatabaseTables();
    await hydrateDemos();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const dateFilter = searchParams.get('dateFilter') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEndStr = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const where: any = {};

    // Status filtering
    if (status === 'TODAY') {
      where.demoDate = todayStr;
      where.status = 'SCHEDULED';
    } else if (status === 'UPCOMING') {
      where.demoDate = { gt: todayStr };
      where.status = 'SCHEDULED';
    } else if (status !== 'ALL') {
      where.status = status;
    }

    // Date filtering override if specified
    if (dateFilter === 'today') {
      where.demoDate = todayStr;
    } else if (dateFilter === 'tomorrow') {
      where.demoDate = tomorrowStr;
    } else if (dateFilter === 'this_week') {
      where.demoDate = { gte: weekStartStr, lte: weekEndStr };
    }

    // Search filter (Name, Mobile, Company)
    if (search.trim()) {
      const query = search.trim();
      const normSearch = normalizePhoneNumber(query);

      where.lead = {
        OR: [
          { name: { contains: query } },
          { company: { contains: query } },
          { mobile: { contains: query } },
          ...(normSearch ? [{ normalizedMobile: { contains: normSearch } }] : []),
        ],
      };
    }

    const skip = (page - 1) * limit;

    let demos: any[] = [];
    let totalCount = 0;

    try {
      const res = await Promise.all([
        prisma.demo.findMany({
          where,
          orderBy: [{ demoDate: 'asc' }, { demoTime: 'asc' }],
          skip,
          take: limit,
          include: {
            lead: true,
          },
        }),
        prisma.demo.count({ where }),
      ]);
      demos = res[0];
      totalCount = res[1];
    } catch (dbErr) {
      console.warn('[GET Demos DB Error - Fallback to Firestore]:', dbErr);
    }

    if (demos.length === 0) {
      const { getFirestoreDocs } = await import('@/lib/firebase/firestore');
      const fsDemos = await getFirestoreDocs('demos');
      if (fsDemos && fsDemos.length > 0) {
        let filtered = fsDemos.map((d) => ({
          ...d,
          lead: d.lead || { name: 'Lead', mobile: '' },
        }));
        if (status !== 'ALL') {
          filtered = filtered.filter((d) => d.status === status);
        }
        demos = filtered.slice(skip, skip + limit);
        totalCount = filtered.length;
      }
    }

    return NextResponse.json({
      demos,
      todayStr,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching demos:', error);
    return NextResponse.json({ error: 'Failed to fetch demos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseTables();
    const body = await req.json();
    const {
      leadId,
      demoDate,
      demoTime,
      duration = '30 mins',
      demoLink,
      meetingId,
      password,
      requirements,
      notes,
      assignedTo = 'Sales Representative',
      reminderEnabled = true,
      reminderTime = '15_MINS',
    } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }
    if (!demoDate) {
      return NextResponse.json({ error: 'Demo Date is required' }, { status: 400 });
    }
    if (!demoTime) {
      return NextResponse.json({ error: 'Demo Time is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if active scheduled demo already exists for this lead
    const existingActiveDemo = await prisma.demo.findFirst({
      where: {
        leadId,
        status: 'SCHEDULED',
      },
    });

    const [newDemo, updatedLead] = await prisma.$transaction([
      prisma.demo.create({
        data: {
          leadId,
          demoDate,
          demoTime,
          duration,
          demoLink: demoLink ? demoLink.trim() : null,
          meetingId: meetingId ? meetingId.trim() : null,
          password: password ? password.trim() : null,
          requirements: requirements ? requirements.trim() : lead.initialRequirements,
          notes: notes ? notes.trim() : null,
          assignedTo,
          reminderEnabled: Boolean(reminderEnabled),
          reminderTime,
          status: 'SCHEDULED',
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: {
          status: 'DEMO',
          demoDate,
          demoTime,
          demoLink: demoLink ? demoLink.trim() : null,
          meetingId: meetingId ? meetingId.trim() : null,
          password: password ? password.trim() : null,
          demoStatus: 'SCHEDULED',
          activities: {
            create: [
              {
                activityType: 'DEMO_SCHEDULED',
                description: `Demo Scheduled for ${demoDate} at ${demoTime}${
                  demoLink ? ` (Link provided)` : ''
                }`,
              },
            ],
          },
        },
      }),
    ]);

    syncToFirestore('demos', newDemo.id, newDemo).catch(console.warn);

    return NextResponse.json(
      {
        demo: newDemo,
        lead: updatedLead,
        warning: existingActiveDemo
          ? 'An active scheduled demo already existed for this lead. A new demo attempt was created.'
          : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error scheduling demo:', error);
    return NextResponse.json({ error: 'Failed to schedule demo' }, { status: 500 });
  }
}
