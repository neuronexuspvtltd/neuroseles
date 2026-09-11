import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabaseTables } from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { requireAuth } from '@/lib/auth/session';

import { syncToFirestore } from '@/lib/firebase/firestore';
import { hydrateLeads } from '@/lib/firebase/hydration';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseTables();
    await hydrateLeads();

    const { user, error } = await requireAuth('leads.view');
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const sort = searchParams.get('sort') || 'newest';
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};

    // Filter by status if not ALL
    if (status !== 'ALL') {
      where.status = status;
    }

    // Filter by assigned user if provided or required by role
    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    // Search filter (Name, Mobile, Company)
    if (search.trim()) {
      const query = search.trim();
      const normSearch = normalizePhoneNumber(query);

      where.OR = [
        { name: { contains: query } },
        { company: { contains: query } },
        { mobile: { contains: query } },
        ...(normSearch ? [{ normalizedMobile: { contains: normSearch } }] : []),
      ];
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'recently_contacted') {
      orderBy = { updatedAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    let leads: any[] = [];
    let totalCount = 0;

    try {
      const res = await Promise.all([
        prisma.lead.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, role: true },
            },
            createdBy: {
              select: { id: true, name: true },
            },
            calls: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            followUps: {
              where: { status: 'PENDING' },
              orderBy: { followUpDate: 'asc' },
              take: 1,
            },
            quotations: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
        prisma.lead.count({ where }),
      ]);
      leads = res[0];
      totalCount = res[1];
    } catch (dbErr) {
      console.warn('[GET Leads DB Error - Fallback to Firestore]:', dbErr);
    }

    if (leads.length === 0) {
      const { getFirestoreDocs } = await import('@/lib/firebase/firestore');
      const fsLeads = await getFirestoreDocs('leads');
      if (fsLeads && fsLeads.length > 0) {
        let filtered = fsLeads.map((l) => ({
          ...l,
          assignedTo: l.assignedTo || null,
          createdBy: l.createdBy || null,
          calls: l.calls || [],
          followUps: l.followUps || [],
          quotations: l.quotations || [],
        }));
        if (status !== 'ALL') {
          filtered = filtered.filter((l) => l.status === status);
        }
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          filtered = filtered.filter(
            (l) =>
              (l.name && l.name.toLowerCase().includes(q)) ||
              (l.mobile && l.mobile.includes(q)) ||
              (l.company && l.company.toLowerCase().includes(q))
          );
        }
        leads = filtered.slice(skip, skip + limit);
        totalCount = filtered.length;
      }
    }

    return NextResponse.json({
      leads,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('Error fetching leads:', err);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseTables();
    const { user, error } = await requireAuth('leads.create');
    if (error) return error;

    const body = await req.json();
    const {
      name,
      mobile,
      email,
      company,
      city,
      source,
      initialRequirements,
      notes,
      assignedToId,
    } = body;

    // Required fields validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Full Name is required' }, { status: 400 });
    }
    if (!mobile || !mobile.trim()) {
      return NextResponse.json({ error: 'Mobile Number is required' }, { status: 400 });
    }

    const normalizedMobile = normalizePhoneNumber(mobile);
    if (!normalizedMobile) {
      return NextResponse.json({ error: 'Invalid Mobile Number format' }, { status: 400 });
    }

    // Check duplicate mobile in DB safely
    let existing: any = null;
    try {
      existing = await prisma.lead.findUnique({
        where: { normalizedMobile },
      });
    } catch (e) {}

    if (existing) {
      return NextResponse.json(
        {
          error: 'This mobile number already exists.',
          existingLead: {
            id: existing.id,
            name: existing.name,
            mobile: existing.mobile,
          },
        },
        { status: 409 }
      );
    }

    let assignedUser = null;
    if (assignedToId) {
      try {
        assignedUser = await prisma.user.findUnique({
          where: { id: assignedToId },
        });
      } catch (e) {}
    }

    let validCreatedById: string | null = null;
    if (user?.id) {
      try {
        const u = await prisma.user.findUnique({ where: { id: user.id } });
        if (u) validCreatedById = user.id;
      } catch (e) {}
    }

    let newLead: any = null;
    try {
      newLead = await prisma.lead.create({
        data: {
          name: name.trim(),
          mobile: mobile.trim(),
          normalizedMobile,
          email: email ? email.trim() : null,
          company: company ? company.trim() : null,
          city: city ? city.trim() : null,
          source: source ? source.trim() : 'Direct',
          initialRequirements: initialRequirements ? initialRequirements.trim() : null,
          notes: notes ? notes.trim() : null,
          status: 'NEW',
          assignedToId: assignedToId || null,
          createdById: validCreatedById,
          activities: {
            create: {
              userId: validCreatedById,
              userName: user.name,
              activityType: 'LEAD_CREATED',
              description: assignedUser
                ? `Lead Created by ${user.name} and assigned to ${assignedUser.name}`
                : `Lead Created by ${user.name}`,
            },
          },
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          calls: true,
          followUps: true,
          activities: true,
        },
      });
    } catch (dbCreateErr: any) {
      console.warn('[Prisma Lead Create Warning - Fallback to Firestore Sync]:', dbCreateErr);
      if (dbCreateErr.code === 'P2002') {
        return NextResponse.json(
          { error: 'This mobile number already exists.' },
          { status: 409 }
        );
      }
      const fallbackId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      newLead = {
        id: fallbackId,
        name: name.trim(),
        mobile: mobile.trim(),
        normalizedMobile,
        email: email ? email.trim() : null,
        company: company ? company.trim() : null,
        city: city ? city.trim() : null,
        source: source ? source.trim() : 'Direct',
        initialRequirements: initialRequirements ? initialRequirements.trim() : null,
        notes: notes ? notes.trim() : null,
        status: 'NEW',
        assignedToId: assignedToId || null,
        createdById: validCreatedById,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        calls: [],
        followUps: [],
        activities: [],
      };
    }

    // Sync to Cloud Firestore in background (non-blocking)
    syncToFirestore('leads', newLead.id, newLead).catch((err) =>
      console.warn('[Firestore Background Sync Error]:', err)
    );

    return NextResponse.json(newLead, { status: 201 });
  } catch (err: any) {
    console.error('Error creating lead:', err);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
