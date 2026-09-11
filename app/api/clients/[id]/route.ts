import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            calls: { orderBy: { createdAt: 'desc' } },
            followUps: { orderBy: { followUpDate: 'asc' } },
            demos: { orderBy: { demoDate: 'desc' } },
            quotations: {
              orderBy: { createdAt: 'desc' },
              include: { items: true },
            },
            activities: { orderBy: { createdAt: 'desc' } },
          },
        },
        projects: {
          orderBy: { createdAt: 'desc' },
          include: {
            requirementHistories: { orderBy: { createdAt: 'desc' } },
            files: { orderBy: { createdAt: 'desc' } },
            projectNotes: { orderBy: { createdAt: 'desc' } },
          },
        },
        files: { orderBy: { createdAt: 'desc' } },
        clientNotes: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Merge activities from both Lead and Client without duplicates
    const combinedActivitiesMap = new Map();
    if (client.lead?.activities) {
      client.lead.activities.forEach((act) => combinedActivitiesMap.set(act.id, act));
    }
    client.activities.forEach((act) => combinedActivitiesMap.set(act.id, act));

    const combinedActivities = Array.from(combinedActivitiesMap.values()).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Merge quotations from lead if present
    const quotations = client.lead?.quotations || [];
    // Merge demos from lead if present
    const demos = client.lead?.demos || [];
    // Merge followUps from lead if present
    const followUps = client.lead?.followUps || [];

    return NextResponse.json({
      ...client,
      activities: combinedActivities,
      quotations,
      demos,
      followUps,
    });
  } catch (error: any) {
    console.error('Error fetching client profile:', error);
    return NextResponse.json({ error: 'Failed to fetch client profile' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, mobile, email, company, city, address, status, notes } = body;

    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (company !== undefined) updateData.company = company ? company.trim() : null;
    if (city !== undefined) updateData.city = city ? city.trim() : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    if (mobile && mobile !== existingClient.mobile) {
      const normMobile = normalizePhoneNumber(mobile);
      if (!normMobile) {
        return NextResponse.json({ error: 'Invalid mobile number' }, { status: 400 });
      }
      const duplicate = await prisma.client.findUnique({
        where: { normalizedMobile: normMobile },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: 'Mobile number already used by another client' }, { status: 400 });
      }
      updateData.mobile = mobile.trim();
      updateData.normalizedMobile = normMobile;
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    if (status && status !== existingClient.status) {
      await prisma.activity.create({
        data: {
          clientId: id,
          leadId: existingClient.leadId,
          activityType: 'CLIENT_STATUS_CHANGED',
          description: `Client status changed from ${existingClient.status} to ${status}`,
        },
      });
    } else {
      await prisma.activity.create({
        data: {
          clientId: id,
          leadId: existingClient.leadId,
          activityType: 'CLIENT_UPDATED',
          description: `Client details updated`,
        },
      });
    }

    return NextResponse.json(updatedClient);
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
