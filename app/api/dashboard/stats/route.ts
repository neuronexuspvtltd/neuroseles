import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  format,
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  parseISO,
  differenceInDays,
} from 'date-fns';
import { requireAuth } from '@/lib/auth/session';

function summarizeCalls(callsList: { callResult: string; customerResponse: string }[]) {
  const total = callsList.length;
  const connected = callsList.filter((c) => c.callResult === 'Call Received').length;
  const notConnected = total - connected;

  const responses: Record<string, number> = {
    'General Call': 0,
    Interested: 0,
    'Demo Required': 0,
    'Quotation Required': 0,
    'Call Later': 0,
    'Not Interested': 0,
    Converted: 0,
  };

  const results: Record<string, number> = {
    'Call Received': 0,
    'Call Not Received': 0,
    Busy: 0,
    'Wrong Number': 0,
  };

  callsList.forEach((c) => {
    if (c.customerResponse) {
      responses[c.customerResponse] = (responses[c.customerResponse] || 0) + 1;
    }
    if (c.callResult) {
      results[c.callResult] = (results[c.callResult] || 0) + 1;
    }
  });

  const positiveResponses =
    (responses['Interested'] || 0) +
    (responses['Demo Required'] || 0) +
    (responses['Quotation Required'] || 0) +
    (responses['Converted'] || 0);

  const conversionRate = connected > 0
    ? Math.round((positiveResponses / connected) * 100)
    : 0;

  return {
    total,
    connected,
    notConnected,
    conversionRate,
    responses,
  };
}

async function autoSeedSampleData() {
  try {
    const leadCount = await prisma.lead.count();
    if (leadCount === 0) {
      console.log('[Auto-Seed] Seeding sample CRM leads and operations...');
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const adminId = admin?.id || null;

      const lead1 = await prisma.lead.create({
        data: {
          name: 'Rahul Sharma',
          mobile: '9876543210',
          normalizedMobile: '919876543210',
          email: 'rahul.sharma@techcorp.in',
          company: 'TechCorp Solutions',
          city: 'Mumbai',
          source: 'Website',
          initialRequirements: 'Custom ERP & Sales CRM portal',
          status: 'INTERESTED',
          createdById: adminId,
        },
      });

      const lead2 = await prisma.lead.create({
        data: {
          name: 'Priya Patel',
          mobile: '9812345678',
          normalizedMobile: '919812345678',
          email: 'priya@innovatelabs.com',
          company: 'Innovate Labs',
          city: 'Bangalore',
          source: 'LinkedIn',
          initialRequirements: 'Mobile app development for iOS & Android',
          status: 'DEMO',
          createdById: adminId,
        },
      });

      const lead3 = await prisma.lead.create({
        data: {
          name: 'Amit Verma',
          mobile: '9988776655',
          normalizedMobile: '919988776655',
          email: 'amit@veratrading.co',
          company: 'Vera Trading Co',
          city: 'Delhi',
          source: 'Referral',
          initialRequirements: 'E-commerce platform with payment gateway',
          status: 'QUOTATION',
          createdById: adminId,
        },
      });

      await prisma.lead.create({
        data: {
          name: 'Sneha Kulkarni',
          mobile: '9765432109',
          normalizedMobile: '919765432109',
          email: 'sneha@nexusdigital.io',
          company: 'Nexus Digital',
          city: 'Pune',
          source: 'Direct',
          initialRequirements: 'SaaS Dashboard redesign',
          status: 'NEW',
          createdById: adminId,
        },
      });

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      await prisma.demo.create({
        data: {
          leadId: lead2.id,
          demoDate: todayStr,
          demoTime: '14:30',
          demoLink: 'https://meet.google.com/xyz-demo-test',
          status: 'SCHEDULED',
          notes: 'Product demonstration of CRM & Lead Tracking',
          createdById: adminId,
        },
      });

      await prisma.followUp.create({
        data: {
          leadId: lead1.id,
          followUpDate: todayStr,
          followUpTime: '11:00',
          note: 'Call regarding scope requirement feedback',
          status: 'PENDING',
          createdById: adminId,
        },
      });

      await prisma.quotation.create({
        data: {
          leadId: lead3.id,
          quotationNumber: 'QT-0001',
          projectTitle: 'E-Commerce Platform Development',
          currency: 'INR',
          quotationDate: todayStr,
          validUntil: todayStr,
          status: 'SENT',
          grandTotal: 150000,
          createdById: adminId,
          items: {
            create: [
              {
                name: 'E-Commerce Website Development',
                quantity: 1,
                unitPrice: 150000,
                total: 150000,
              },
            ],
          },
        },
      });

      console.log('[Auto-Seed] Sample CRM data seeded successfully!');
    }
  } catch (err) {
    console.error('[Auto-Seed Error]:', err);
  }
}

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAuth('dashboard.view');
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all';
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    // Determine Date Ranges for filtering
    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;
    let prevPeriodStart: Date | null = null;
    let prevPeriodEnd: Date | null = null;

    if (period === 'today') {
      periodStart = startOfDay(now);
      periodEnd = endOfDay(now);
      prevPeriodStart = startOfDay(subDays(now, 1));
      prevPeriodEnd = endOfDay(subDays(now, 1));
    } else if (period === 'yesterday') {
      const yesterday = subDays(now, 1);
      periodStart = startOfDay(yesterday);
      periodEnd = endOfDay(yesterday);
      const dayBefore = subDays(now, 2);
      prevPeriodStart = startOfDay(dayBefore);
      prevPeriodEnd = endOfDay(dayBefore);
    } else if (period === '7days') {
      periodStart = startOfDay(subDays(now, 6));
      periodEnd = endOfDay(now);
      prevPeriodStart = startOfDay(subDays(now, 13));
      prevPeriodEnd = endOfDay(subDays(now, 7));
    } else if (period === '30days') {
      periodStart = startOfDay(subDays(now, 29));
      periodEnd = endOfDay(now);
      prevPeriodStart = startOfDay(subDays(now, 59));
      prevPeriodEnd = endOfDay(subDays(now, 30));
    } else if (period === 'this_month') {
      periodStart = startOfMonth(now);
      periodEnd = endOfDay(now);
      const lastMonth = subMonths(now, 1);
      prevPeriodStart = startOfMonth(lastMonth);
      prevPeriodEnd = endOfMonth(lastMonth);
    } else if (period === 'last_month') {
      const lastMonth = subMonths(now, 1);
      periodStart = startOfMonth(lastMonth);
      periodEnd = endOfMonth(lastMonth);
      const prev2Month = subMonths(now, 2);
      prevPeriodStart = startOfMonth(prev2Month);
      prevPeriodEnd = endOfMonth(prev2Month);
    } else if (period === 'this_year') {
      periodStart = startOfYear(now);
      periodEnd = endOfDay(now);
      const prevYear = new Date(now.getFullYear() - 1, 0, 1);
      prevPeriodStart = startOfYear(prevYear);
      prevPeriodEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    } else if (period === 'custom' && customStart && customEnd) {
      periodStart = startOfDay(parseISO(customStart));
      periodEnd = endOfDay(parseISO(customEnd));
    }

    // Build Prisma Date Filter Clause for Lead creation
    const leadDateWhere = periodStart && periodEnd ? { createdAt: { gte: periodStart, lte: periodEnd } } : {};
    const prevLeadDateWhere = prevPeriodStart && prevPeriodEnd ? { createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd } } : {};

    // Auto-seed initial sample leads and operations if database is empty
    await autoSeedSampleData();

    // Execute aggregated parallel database queries
    const [
      totalLeadsLifetime,
      totalLeadsInPeriod,
      prevPeriodLeadsCount,
      newLeadsCount,
      calledLeadsCount,
      interestedLeadsCount,
      followUpLeadsCount,
      demoLeadsCount,
      quotationLeadsCount,
      notInterestedLeadsCount,
      convertedLeadsCount,

      // Follow-ups queries
      pendingFollowUpsCount,
      todayFollowUps,
      overdueFollowUpsRaw,

      // Demos queries
      upcomingDemosCount,
      todayDemos,
      completedDemosCount,

      // Quotations queries
      totalQuotationsCount,
      draftQuotationsCount,
      sentQuotationsCount,
      acceptedQuotationsCount,
      rejectedQuotationsCount,
      expiredQuotationsCount,
      viewedQuotationsCount,
      quotationsValueSum,
      acceptedQuotationsValueSum,

      // Clients queries
      totalClientsCount,
      activeClientsCount,
      convertedThisMonthCount,
      convertedThisYearCount,

      // Calls queries
      todayCallsRaw,
      weeklyCallsRaw,
      monthlyCallsRaw,
      periodCallsRaw,

      // Feeds
      recentActivities,
      recentLeads,
      recentClients,
      allLeadsForSourceAndTrend,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: leadDateWhere }),
      prevPeriodStart && prevPeriodEnd ? prisma.lead.count({ where: prevLeadDateWhere }) : Promise.resolve(0),
      prisma.lead.count({ where: { status: 'NEW', ...leadDateWhere } }),
      prisma.lead.count({
        where: {
          ...leadDateWhere,
          OR: [
            { status: { in: ['CALLED', 'INTERESTED', 'FOLLOW_UP', 'DEMO', 'QUOTATION', 'CONVERTED'] } },
            { calls: { some: {} } },
          ],
        },
      }),
      prisma.lead.count({ where: { status: 'INTERESTED', ...leadDateWhere } }),
      prisma.lead.count({ where: { status: 'FOLLOW_UP', ...leadDateWhere } }),
      prisma.lead.count({ where: { status: 'DEMO', ...leadDateWhere } }),
      prisma.lead.count({ where: { status: 'QUOTATION', ...leadDateWhere } }),
      prisma.lead.count({ where: { status: 'NOT_INTERESTED', ...leadDateWhere } }),
      prisma.lead.count({ where: { status: 'CONVERTED', ...leadDateWhere } }),

      // Follow-ups
      prisma.followUp.count({ where: { status: 'PENDING' } }),
      prisma.followUp.findMany({
        where: { followUpDate: todayStr, status: 'PENDING' },
        include: { lead: true },
        orderBy: { followUpTime: 'asc' },
      }),
      prisma.followUp.findMany({
        where: { followUpDate: { lt: todayStr }, status: 'PENDING' },
        include: { lead: true },
        orderBy: { followUpDate: 'asc' },
      }),

      // Demos
      prisma.demo.count({ where: { status: 'SCHEDULED', demoDate: { gte: todayStr } } }),
      prisma.demo.findMany({
        where: { demoDate: todayStr, status: 'SCHEDULED' },
        include: { lead: true },
        orderBy: { demoTime: 'asc' },
      }),
      prisma.demo.count({ where: { status: 'COMPLETED' } }),

      // Quotations
      prisma.quotation.count({ where: periodStart && periodEnd ? { createdAt: { gte: periodStart, lte: periodEnd } } : {} }),
      prisma.quotation.count({ where: { status: 'DRAFT' } }),
      prisma.quotation.count({ where: { status: 'SENT' } }),
      prisma.quotation.count({ where: { status: 'ACCEPTED' } }),
      prisma.quotation.count({ where: { status: 'REJECTED' } }),
      prisma.quotation.count({ where: { status: 'EXPIRED' } }),
      prisma.quotation.count({ where: { status: 'VIEWED' } }),
      prisma.quotation.aggregate({
        where: { status: { in: ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED'] } },
        _sum: { grandTotal: true },
      }),
      prisma.quotation.aggregate({
        where: { status: 'ACCEPTED' },
        _sum: { grandTotal: true },
      }),

      // Clients
      prisma.client.count(),
      prisma.client.count({ where: { status: 'ACTIVE' } }),
      prisma.client.count({ where: { clientSince: { gte: startOfMonth(now) } } }),
      prisma.client.count({ where: { clientSince: { gte: startOfYear(now) } } }),

      // Calls
      prisma.call.findMany({
        where: { createdAt: { gte: startOfDay(now), lte: endOfDay(now) } },
        select: { callResult: true, customerResponse: true },
      }),
      prisma.call.findMany({
        where: { createdAt: { gte: startOfDay(subDays(now, 6)), lte: endOfDay(now) } },
        select: { callResult: true, customerResponse: true },
      }),
      prisma.call.findMany({
        where: { createdAt: { gte: startOfMonth(now), lte: endOfDay(now) } },
        select: { callResult: true, customerResponse: true },
      }),
      prisma.call.findMany({
        where: periodStart && periodEnd ? { createdAt: { gte: periodStart, lte: periodEnd } } : {},
        select: { callResult: true, customerResponse: true },
      }),

      // Feeds
      prisma.activity.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: { select: { id: true, name: true, mobile: true, company: true, status: true } },
          client: { select: { id: true, name: true, mobile: true, company: true, status: true } },
        },
      }),
      prisma.lead.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          mobile: true,
          company: true,
          source: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.client.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          projects: { take: 1, orderBy: { updatedAt: 'desc' } },
        },
      }),

      // Raw leads for Source & Time Trends
      prisma.lead.findMany({
        where: leadDateWhere,
        select: { id: true, source: true, createdAt: true, status: true },
      }),
    ]);

    // Calculate Growth Percentage vs Previous Period
    let totalLeadsGrowth = 0;
    if (prevPeriodLeadsCount > 0) {
      totalLeadsGrowth = Math.round(((totalLeadsInPeriod - prevPeriodLeadsCount) / prevPeriodLeadsCount) * 100);
    } else if (totalLeadsInPeriod > 0 && prevPeriodStart) {
      totalLeadsGrowth = 100;
    }

    // Process Overdue Follow-ups with days overdue calculation
    const overdueFollowUps = overdueFollowUpsRaw.map((f) => {
      const itemDate = parseISO(f.followUpDate);
      const daysOverdue = Math.max(1, differenceInDays(startOfDay(now), startOfDay(itemDate)));
      return {
        ...f,
        daysOverdue,
      };
    });

    // Upcoming Activities (Chronological feed of Demos & Follow-ups)
    const upcomingFollowUpsRaw = await prisma.followUp.findMany({
      where: { followUpDate: { gte: todayStr }, status: 'PENDING' },
      include: { lead: true },
      take: 10,
      orderBy: [{ followUpDate: 'asc' }, { followUpTime: 'asc' }],
    });

    const upcomingDemosRaw = await prisma.demo.findMany({
      where: { demoDate: { gte: todayStr }, status: 'SCHEDULED' },
      include: { lead: true },
      take: 10,
      orderBy: [{ demoDate: 'asc' }, { demoTime: 'asc' }],
    });

    const upcomingActivities = [
      ...upcomingFollowUpsRaw.map((f) => ({
        id: `f-${f.id}`,
        type: 'FOLLOW_UP' as const,
        title: `Follow-up with ${f.lead.name}`,
        customerName: f.lead.name,
        customerMobile: f.lead.mobile,
        leadId: f.lead.id,
        date: f.followUpDate,
        time: f.followUpTime,
        note: f.note,
        status: f.status,
      })),
      ...upcomingDemosRaw.map((d) => ({
        id: `d-${d.id}`,
        type: 'DEMO' as const,
        title: `Product Demo for ${d.lead.name}`,
        customerName: d.lead.name,
        customerMobile: d.lead.mobile,
        leadId: d.lead.id,
        date: d.demoDate,
        time: d.demoTime,
        note: d.notes || 'Product Demo Meeting',
        demoLink: d.demoLink,
        status: d.status,
      })),
    ]
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 10);

    // Call Analytics Summaries
    const callAnalytics = {
      today: summarizeCalls(todayCallsRaw),
      weekly: summarizeCalls(weeklyCallsRaw),
      monthly: summarizeCalls(monthlyCallsRaw),
      inPeriod: summarizeCalls(periodCallsRaw),
    };

    // Lead Sources Aggregation
    const sourceCounts: Record<string, number> = {};
    allLeadsForSourceAndTrend.forEach((l) => {
      const src = l.source ? l.source.trim() : 'Unknown';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    const totalLeadsForSource = allLeadsForSourceAndTrend.length || 1;
    const leadSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: Math.round((count / totalLeadsForSource) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Lead Generation Over Time Trend (Daily / Monthly buckets)
    const trendBuckets: Record<string, number> = {};
    if (period === 'this_year' || period === 'last_month' || period === 'all') {
      // Group by Month YYYY-MM
      allLeadsForSourceAndTrend.forEach((l) => {
        const key = format(new Date(l.createdAt), 'MMM yyyy');
        trendBuckets[key] = (trendBuckets[key] || 0) + 1;
      });
    } else {
      // Group by Day YYYY-MM-DD
      allLeadsForSourceAndTrend.forEach((l) => {
        const key = format(new Date(l.createdAt), 'dd MMM');
        trendBuckets[key] = (trendBuckets[key] || 0) + 1;
      });
    }

    const leadGenerationTrend = Object.entries(trendBuckets).map(([label, count]) => ({
      label,
      count,
    }));

    // Lead Conversion Funnel Math
    const totalLeadsCount = periodStart && periodEnd ? totalLeadsInPeriod : totalLeadsLifetime;
    const calledStepCount = totalLeadsCount - newLeadsCount;
    const interestedStepCount = interestedLeadsCount + demoLeadsCount + quotationLeadsCount + convertedLeadsCount;
    const demoStepCount = demoLeadsCount + quotationLeadsCount + convertedLeadsCount;
    const quotationStepCount = quotationLeadsCount + convertedLeadsCount;
    const convertedStepCount = convertedLeadsCount;

    const conversionFunnel = [
      { stage: 'Total Leads', count: totalLeadsCount, percentOfTotal: 100, percentOfPrevious: 100 },
      {
        stage: 'Called',
        count: calledStepCount,
        percentOfTotal: totalLeadsCount ? Math.round((calledStepCount / totalLeadsCount) * 100) : 0,
        percentOfPrevious: totalLeadsCount ? Math.round((calledStepCount / totalLeadsCount) * 100) : 0,
      },
      {
        stage: 'Interested',
        count: interestedStepCount,
        percentOfTotal: totalLeadsCount ? Math.round((interestedStepCount / totalLeadsCount) * 100) : 0,
        percentOfPrevious: calledStepCount ? Math.round((interestedStepCount / calledStepCount) * 100) : 0,
      },
      {
        stage: 'Demo',
        count: demoStepCount,
        percentOfTotal: totalLeadsCount ? Math.round((demoStepCount / totalLeadsCount) * 100) : 0,
        percentOfPrevious: interestedStepCount ? Math.round((demoStepCount / interestedStepCount) * 100) : 0,
      },
      {
        stage: 'Quotation',
        count: quotationStepCount,
        percentOfTotal: totalLeadsCount ? Math.round((quotationStepCount / totalLeadsCount) * 100) : 0,
        percentOfPrevious: demoStepCount ? Math.round((quotationStepCount / demoStepCount) * 100) : 0,
      },
      {
        stage: 'Converted',
        count: convertedStepCount,
        percentOfTotal: totalLeadsCount ? Math.round((convertedStepCount / totalLeadsCount) * 100) : 0,
        percentOfPrevious: quotationStepCount ? Math.round((convertedStepCount / quotationStepCount) * 100) : 0,
      },
    ];

    // Quotation Analytics
    const totalQuotationValue = quotationsValueSum._sum.grandTotal || 0;
    const acceptedQuotationValue = acceptedQuotationsValueSum._sum.grandTotal || 0;
    const quotationAcceptanceRate = totalQuotationsCount
      ? Math.round((acceptedQuotationsCount / totalQuotationsCount) * 100)
      : 0;

    // Overall Conversion Rate
    const overallConversionRate = totalLeadsCount
      ? Math.round((convertedLeadsCount / totalLeadsCount) * 100)
      : 0;

    return NextResponse.json({
      period,
      summary: {
        totalLeads: totalLeadsCount,
        totalLeadsLifetime,
        totalLeadsInPeriod,
        totalLeadsGrowth,
        newLeads: newLeadsCount,
        calledLeads: calledLeadsCount,
        interestedLeads: interestedLeadsCount,
        followUpLeads: followUpLeadsCount,
        demoLeads: demoLeadsCount,
        quotationLeads: quotationLeadsCount,
        convertedClients: convertedLeadsCount,

        // Follow-ups
        pendingFollowUps: pendingFollowUpsCount,
        todayFollowUpsCount: todayFollowUps.length,
        overdueFollowUpsCount: overdueFollowUps.length,

        // Demos
        upcomingDemosCount,
        todayDemosCount: todayDemos.length,
        completedDemosCount,

        // Quotations
        totalQuotations: totalQuotationsCount,
        draftQuotations: draftQuotationsCount,
        sentQuotations: sentQuotationsCount,
        viewedQuotations: viewedQuotationsCount,
        acceptedQuotations: acceptedQuotationsCount,
        rejectedQuotations: rejectedQuotationsCount,
        expiredQuotations: expiredQuotationsCount,
        totalQuotationValue,
        acceptedQuotationValue,
        quotationAcceptanceRate,

        // Clients
        totalClients: totalClientsCount,
        activeClients: activeClientsCount,
        convertedThisMonth: convertedThisMonthCount,
        convertedThisYear: convertedThisYearCount,
        overallConversionRate,
      },

      callAnalytics,

      todaysWork: {
        followUps: todayFollowUps,
        demos: todayDemos,
      },

      overdueFollowUps,
      upcomingActivities,

      pipeline: {
        NEW: newLeadsCount,
        CALLED: calledLeadsCount,
        INTERESTED: interestedLeadsCount,
        FOLLOW_UP: followUpLeadsCount,
        DEMO: demoLeadsCount,
        QUOTATION: quotationLeadsCount,
        NOT_INTERESTED: notInterestedLeadsCount,
        CONVERTED: convertedLeadsCount,
      },

      conversionFunnel,
      leadSources,
      leadGenerationTrend,

      quotationAnalytics: {
        totalQuotations: totalQuotationsCount,
        draft: draftQuotationsCount,
        sent: sentQuotationsCount,
        viewed: viewedQuotationsCount,
        accepted: acceptedQuotationsCount,
        rejected: rejectedQuotationsCount,
        expired: expiredQuotationsCount,
        totalValue: totalQuotationValue,
        acceptedValue: acceptedQuotationValue,
        acceptanceRate: quotationAcceptanceRate,
      },

      clientConversionAnalytics: {
        totalConverted: totalClientsCount,
        convertedThisMonth: convertedThisMonthCount,
        convertedThisYear: convertedThisYearCount,
        conversionRate: overallConversionRate,
      },

      recentActivities,
      recentLeads,
      recentClients,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      period: 'all',
      summary: {
        totalLeads: 0,
        totalLeadsLifetime: 0,
        totalLeadsInPeriod: 0,
        totalLeadsGrowth: 0,
        newLeads: 0,
        calledLeads: 0,
        interestedLeads: 0,
        followUpLeads: 0,
        demoLeads: 0,
        quotationLeads: 0,
        convertedClients: 0,
        pendingFollowUps: 0,
        todayFollowUpsCount: 0,
        overdueFollowUpsCount: 0,
        upcomingDemosCount: 0,
        todayDemosCount: 0,
        completedDemosCount: 0,
        totalQuotations: 0,
        draftQuotations: 0,
        sentQuotations: 0,
        viewedQuotations: 0,
        acceptedQuotations: 0,
        rejectedQuotations: 0,
        expiredQuotations: 0,
        totalQuotationValue: 0,
        acceptedQuotationValue: 0,
        quotationAcceptanceRate: 0,
        totalClients: 0,
        activeClients: 0,
        convertedThisMonth: 0,
        convertedThisYear: 0,
        overallConversionRate: 0,
      },
      callAnalytics: {
        today: { total: 0, connected: 0, notConnected: 0, conversionRate: 0, responses: {}, results: {} },
        weekly: { total: 0, connected: 0, notConnected: 0, conversionRate: 0, responses: {}, results: {} },
        monthly: { total: 0, connected: 0, notConnected: 0, conversionRate: 0, responses: {}, results: {} },
        inPeriod: { total: 0, connected: 0, notConnected: 0, conversionRate: 0, responses: {}, results: {} },
      },
      todaysWork: { followUps: [], demos: [] },
      overdueFollowUps: [],
      upcomingActivities: [],
      pipeline: { NEW: 0, CALLED: 0, INTERESTED: 0, FOLLOW_UP: 0, DEMO: 0, QUOTATION: 0, NOT_INTERESTED: 0, CONVERTED: 0 },
      conversionFunnel: [],
      leadSources: [],
      leadGenerationTrend: [],
      quotationAnalytics: { totalQuotations: 0, draft: 0, sent: 0, viewed: 0, accepted: 0, rejected: 0, expired: 0, totalValue: 0, acceptedValue: 0, acceptanceRate: 0 },
      clientConversionAnalytics: { totalConverted: 0, convertedThisMonth: 0, convertedThisYear: 0, conversionRate: 0 },
      recentActivities: [],
      recentLeads: [],
      recentClients: [],
    });
  }
}
