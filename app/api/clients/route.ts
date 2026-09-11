import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const projectStatus = searchParams.get('projectStatus') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};

    if (status !== 'ALL') {
      where.status = status;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { mobile: { contains: q } },
        { email: { contains: q } },
        { company: { contains: q } },
        { city: { contains: q } },
      ];
    }

    if (projectStatus !== 'ALL') {
      where.projects = {
        some: {
          status: projectStatus,
        },
      };
    }

    const [clients, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lead: {
            select: { id: true, name: true, initialRequirements: true },
          },
          projects: {
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, type: true, status: true, startDate: true, expectedCompletionDate: true },
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true, description: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, mobile, email, company, city, address, notes, leadId } = body;

    if (!name || !mobile) {
      return NextResponse.json({ error: 'Name and Mobile Number are required.' }, { status: 400 });
    }

    const normMobile = normalizePhoneNumber(mobile);
    if (!normMobile) {
      return NextResponse.json({ error: 'Invalid mobile number.' }, { status: 400 });
    }

    // Check if Client already exists with this mobile
    const existingClient = await prisma.client.findUnique({
      where: { normalizedMobile: normMobile },
    });

    if (existingClient) {
      return NextResponse.json({
        error: `Client already exists with mobile number ${mobile}.`,
        existingClientId: existingClient.id,
      }, { status: 400 });
    }

    // Check if Lead exists with this mobile if leadId wasn't passed explicitly
    let linkedLeadId = leadId || null;
    if (!linkedLeadId) {
      const existingLead = await prisma.lead.findUnique({
        where: { normalizedMobile: normMobile },
      });
      if (existingLead) {
        return NextResponse.json({
          error: 'This mobile number already exists as a lead.',
          isExistingLead: true,
          existingLeadId: existingLead.id,
          existingLeadName: existingLead.name,
        }, { status: 400 });
      }

      // Auto-create converted Lead for manual client
      const newLead = await prisma.lead.create({
        data: {
          name: name.trim(),
          mobile: mobile.trim(),
          normalizedMobile: normMobile,
          email: email ? email.trim() : null,
          company: company ? company.trim() : null,
          city: city ? city.trim() : null,
          status: 'CONVERTED',
          convertedAt: new Date(),
          notes: notes ? notes.trim() : null,
        },
      });
      linkedLeadId = newLead.id;
    }

    const client = await prisma.client.create({
      data: {
        leadId: linkedLeadId,
        name: name.trim(),
        mobile: mobile.trim(),
        normalizedMobile: normMobile,
        email: email ? email.trim() : null,
        company: company ? company.trim() : null,
        city: city ? city.trim() : null,
        address: address ? address.trim() : null,
        status: 'ACTIVE',
        notes: notes ? notes.trim() : null,
      },
    });

    if (linkedLeadId) {
      await prisma.lead.update({
        where: { id: linkedLeadId },
        data: { status: 'CONVERTED', convertedAt: new Date() },
      }).catch(() => {});
    }

    await prisma.activity.create({
      data: {
        leadId: linkedLeadId,
        clientId: client.id,
        activityType: 'CLIENT_CREATED',
        description: `Manual Client "${client.name}" created`,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}
