import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureDatabaseTables } from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { requireAuth } from '@/lib/auth/session';
import { syncToFirestore, deleteFromFirestore } from '@/lib/firebase/firestore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseTables();
    const { user, error } = await requireAuth('leads.view');
    if (error) return error;

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        calls: {
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          orderBy: { createdAt: 'desc' },
        },
        demos: {
          orderBy: { createdAt: 'desc' },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (err: any) {
    console.error('Error fetching lead profile:', err);
    return NextResponse.json({ error: 'Failed to fetch lead profile' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseTables();
    const { user, error } = await requireAuth('leads.edit');
    if (error) return error;

    const { id } = await params;
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
      status,
      assignedToId,
      notInterestedReason,
      notInterestedNotes,
      action,
    } = body;

    const existingLead = await prisma.lead.findUnique({
      where: { id },
      include: { assignedTo: true },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    let validUpdatedById: string | null = null;
    if (user?.id) {
      try {
        const u = await prisma.user.findUnique({ where: { id: user.id } });
        if (u) validUpdatedById = user.id;
      } catch (e) {}
    }

    const updateData: any = {
      updatedById: validUpdatedById,
    };
    const activitiesToCreate: any[] = [];

    if (name !== undefined) updateData.name = name;
    if (mobile !== undefined) updateData.mobile = normalizePhoneNumber(mobile);
    if (email !== undefined) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (city !== undefined) updateData.city = city;
    if (source !== undefined) updateData.source = source;

    if (initialRequirements !== undefined) {
      updateData.initialRequirements = initialRequirements;
      activitiesToCreate.push({
        userId: validUpdatedById,
        userName: user.name,
        activityType: 'REQUIREMENTS_UPDATED',
        description: `Lead requirements updated by ${user.name}`,
      });
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Lead Assignment handling
    if (assignedToId !== undefined && assignedToId !== existingLead.assignedToId) {
      updateData.assignedToId = assignedToId || null;
      if (assignedToId) {
        let assignedUser = null;
        try {
          assignedUser = await prisma.user.findUnique({
            where: { id: assignedToId },
          });
        } catch (e) {}
        if (assignedUser) {
          activitiesToCreate.push({
            userId: validUpdatedById,
            userName: user.name,
            activityType: 'LEAD_ASSIGNED',
            description: `Lead assigned to ${assignedUser.name}`,
          });
        }
      } else {
        activitiesToCreate.push({
          userId: validUpdatedById,
          userName: user.name,
          activityType: 'LEAD_ASSIGNED',
          description: `Lead assignment cleared by ${user.name}`,
        });
      }
    }

    if (action === 'CONVERT') {
      updateData.status = 'CONVERTED';
      updateData.convertedAt = new Date();
      activitiesToCreate.push({
        userId: validUpdatedById,
        userName: user.name,
        activityType: 'CONVERTED',
        description: `Lead Converted to Client by ${user.name}`,
      });
    } else if (status && status !== existingLead.status) {
      updateData.status = status;
      if (status === 'NOT_INTERESTED') {
        if (notInterestedReason) updateData.notInterestedReason = notInterestedReason;
        if (notInterestedNotes) updateData.notInterestedNotes = notInterestedNotes;
      }

      activitiesToCreate.push({
        userId: validUpdatedById,
        userName: user.name,
        activityType: 'STATUS_CHANGED',
        description: `Status Changed to ${status.replace('_', ' ')} by ${user.name}`,
      });
    }

    let updatedLead: any = null;
    try {
      updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          ...updateData,
          activities: {
            create: activitiesToCreate,
          },
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          calls: { orderBy: { createdAt: 'desc' } },
          followUps: { orderBy: { createdAt: 'desc' } },
          demos: { orderBy: { createdAt: 'desc' } },
          quotations: { orderBy: { createdAt: 'desc' } },
          activities: { orderBy: { createdAt: 'desc' } },
        },
      });
    } catch (updateErr) {
      console.warn('[Prisma Lead Update Warning - Fallback to Firestore]:', updateErr);
      updatedLead = {
        ...existingLead,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
    }

    await syncToFirestore('leads', updatedLead.id, updatedLead);

    return NextResponse.json(updatedLead);
  } catch (err: any) {
    console.error('Error updating lead:', err);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseTables();
    const { user, error } = await requireAuth('leads.delete');
    if (error) return error;

    const { id } = await params;

    try {
      await prisma.$transaction([
        prisma.activity.deleteMany({ where: { leadId: id } }),
        prisma.call.deleteMany({ where: { leadId: id } }),
        prisma.followUp.deleteMany({ where: { leadId: id } }),
        prisma.demo.deleteMany({ where: { leadId: id } }),
        prisma.lead.delete({ where: { id } }),
      ]);
    } catch (dbDelErr) {
      console.warn('[Prisma Lead Delete Warning - Fallback to Firestore Delete]:', dbDelErr);
    }

    await deleteFromFirestore('leads', id);

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting lead:', err);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
