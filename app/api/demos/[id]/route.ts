import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CUSTOMER_RESPONSE_STATUS_MAP, LeadStatus } from '@/lib/statusConfig';
import { syncToFirestore, deleteFromFirestore } from '@/lib/firebase/firestore';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const demo = await prisma.demo.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            calls: { orderBy: { createdAt: 'desc' } },
            followUps: { orderBy: { createdAt: 'desc' } },
            activities: { orderBy: { createdAt: 'desc' } },
            demos: { orderBy: { createdAt: 'desc' } }, // Full Demo History!
          },
        },
      },
    });

    if (!demo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    return NextResponse.json(demo);
  } catch (error: any) {
    console.error('Error fetching demo:', error);
    return NextResponse.json({ error: 'Failed to fetch demo details' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      action,
      demoDate,
      demoTime,
      duration,
      demoLink,
      meetingId,
      password,
      assignedTo,
      status,
      requirements,
      notes,
      demoResult,
      notInterestedReason,
      notInterestedNotes,
      followUpDate,
      followUpTime,
      followUpNote,
      reason,
    } = body;

    const existingDemo = await prisma.demo.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!existingDemo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    const leadId = existingDemo.leadId;

    // ACTION: RESCHEDULE DEMO
    if (action === 'RESCHEDULE') {
      if (!demoDate || !demoTime) {
        return NextResponse.json(
          { error: 'New Demo Date and Time are required for rescheduling' },
          { status: 400 }
        );
      }

      const [oldDemo, newDemo, updatedLead] = await prisma.$transaction([
        prisma.demo.update({
          where: { id },
          data: {
            status: 'RESCHEDULED',
            completedAt: new Date(),
            notes: reason ? `Rescheduled: ${reason}` : existingDemo.notes,
          },
        }),
        prisma.demo.create({
          data: {
            leadId,
            demoDate,
            demoTime,
            duration: duration || existingDemo.duration,
            demoLink: demoLink !== undefined ? demoLink : existingDemo.demoLink,
            meetingId: meetingId !== undefined ? meetingId : existingDemo.meetingId,
            password: password !== undefined ? password : existingDemo.password,
            requirements: requirements || existingDemo.requirements,
            notes: notes ? notes.trim() : null,
            status: 'SCHEDULED',
          },
        }),
        prisma.lead.update({
          where: { id: leadId },
          data: {
            status: 'DEMO',
            demoDate,
            demoTime,
            demoStatus: 'SCHEDULED',
            activities: {
              create: [
                {
                  activityType: 'DEMO_RESCHEDULED',
                  description: `Demo Rescheduled from ${existingDemo.demoDate} ${
                    existingDemo.demoTime
                  } to ${demoDate} ${demoTime}${reason ? ` (Reason: ${reason})` : ''}`,
                },
              ],
            },
          },
        }),
      ]);

      syncToFirestore('demos', oldDemo.id, oldDemo).catch(console.warn);
      syncToFirestore('demos', newDemo.id, newDemo).catch(console.warn);
      syncToFirestore('leads', leadId, updatedLead).catch(console.warn);

      return NextResponse.json({ oldDemo, newDemo });
    }

    // ACTION: COMPLETE DEMO
    if (action === 'COMPLETE') {
      if (!demoResult) {
        return NextResponse.json({ error: 'Demo Result is required' }, { status: 400 });
      }

      let newLeadStatus: LeadStatus = existingDemo.lead.status as LeadStatus;
      const leadUpdateData: any = {};
      const activitiesToCreate: any[] = [
        {
          activityType: 'DEMO_COMPLETED',
          description: `Demo Completed - Result: ${demoResult}${
            notes ? ` - ${notes}` : ''
          }`,
        },
      ];

      // After demo workflow transitions
      if (demoResult === 'Interested') {
        newLeadStatus = 'INTERESTED';
      } else if (demoResult === 'Wants Quotation') {
        newLeadStatus = 'QUOTATION';
        activitiesToCreate.push({
          activityType: 'QUOTATION_REQUESTED',
          description: 'Quotation requested after demo',
        });
      } else if (demoResult === 'Needs Follow-up') {
        newLeadStatus = 'FOLLOW_UP';
        // Create follow-up record in existing FollowUp table!
        if (followUpDate && followUpTime) {
          const newFollowUp = await prisma.followUp.create({
            data: {
              leadId,
              followUpDate,
              followUpTime,
              note: followUpNote || notes || 'Follow-up scheduled after demo',
              status: 'PENDING',
            },
          });
          syncToFirestore('followups', newFollowUp.id, newFollowUp).catch(console.warn);
          activitiesToCreate.push({
            activityType: 'FOLLOW_UP_SCHEDULED',
            description: `Follow-up Scheduled after demo for ${followUpDate} at ${followUpTime}`,
          });
        }
      } else if (demoResult === 'Not Interested') {
        newLeadStatus = 'NOT_INTERESTED';
        if (notInterestedReason) leadUpdateData.notInterestedReason = notInterestedReason;
        if (notInterestedNotes) leadUpdateData.notInterestedNotes = notInterestedNotes;
      } else if (demoResult === 'Converted') {
        newLeadStatus = 'CONVERTED';
        leadUpdateData.convertedAt = new Date();
        activitiesToCreate.push({
          activityType: 'CONVERTED',
          description: 'Lead converted to client after demo',
        });
      }

      leadUpdateData.status = newLeadStatus;
      leadUpdateData.demoStatus = 'COMPLETED';

      const [updatedDemo, updatedLead] = await prisma.$transaction([
        prisma.demo.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            demoResult,
            notes: notes ? notes.trim() : existingDemo.notes,
            completedAt: new Date(),
          },
        }),
        prisma.lead.update({
          where: { id: leadId },
          data: {
            ...leadUpdateData,
            activities: {
              create: activitiesToCreate,
            },
          },
        }),
      ]);

      syncToFirestore('demos', updatedDemo.id, updatedDemo).catch(console.warn);
      syncToFirestore('leads', leadId, updatedLead).catch(console.warn);

      return NextResponse.json({ demo: updatedDemo, lead: updatedLead });
    }

    // ACTION: CANCEL DEMO
    if (action === 'CANCEL') {
      const [updatedDemo, updatedLead] = await prisma.$transaction([
        prisma.demo.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            completedAt: new Date(),
          },
        }),
        prisma.lead.update({
          where: { id: leadId },
          data: {
            demoStatus: 'CANCELLED',
            activities: {
              create: [
                {
                  activityType: 'DEMO_CANCELLED',
                  description: `Demo Cancelled for ${existingDemo.demoDate}`,
                },
              ],
            },
          },
        }),
      ]);

      syncToFirestore('demos', updatedDemo.id, updatedDemo).catch(console.warn);
      syncToFirestore('leads', leadId, updatedLead).catch(console.warn);

      return NextResponse.json(updatedDemo);
    }

    // ACTION: NO SHOW
    if (action === 'NO_SHOW') {
      const [updatedDemo, updatedLead] = await prisma.$transaction([
        prisma.demo.update({
          where: { id },
          data: {
            status: 'NO_SHOW',
            completedAt: new Date(),
          },
        }),
        prisma.lead.update({
          where: { id: leadId },
          data: {
            demoStatus: 'NO_SHOW',
            activities: {
              create: [
                {
                  activityType: 'DEMO_NO_SHOW',
                  description: `Demo Marked as No Show for ${existingDemo.demoDate}`,
                },
              ],
            },
          },
        }),
      ]);

      syncToFirestore('demos', updatedDemo.id, updatedDemo).catch(console.warn);
      syncToFirestore('leads', leadId, updatedLead).catch(console.warn);

      return NextResponse.json(updatedDemo);
    }

    // GENERAL UPDATE
    const updateData: any = {};
    if (demoDate) updateData.demoDate = demoDate;
    if (demoTime) updateData.demoTime = demoTime;
    if (duration !== undefined) updateData.duration = duration;
    if (demoLink !== undefined) updateData.demoLink = demoLink;
    if (meetingId !== undefined) updateData.meetingId = meetingId;
    if (password !== undefined) updateData.password = password;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status !== undefined) updateData.status = status;

    const updatedDemo = await prisma.demo.update({
      where: { id },
      data: updateData,
    });

    let updatedLead: any = null;
    if (leadId) {
      const leadUpdateData: any = {};
      if (demoDate) leadUpdateData.demoDate = demoDate;
      if (demoTime) leadUpdateData.demoTime = demoTime;
      if (demoLink !== undefined) leadUpdateData.demoLink = demoLink;
      if (meetingId !== undefined) leadUpdateData.meetingId = meetingId;
      if (password !== undefined) leadUpdateData.password = password;

      if (Object.keys(leadUpdateData).length > 0) {
        try {
          updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: leadUpdateData,
          });
        } catch (e) {}
      }

      // Sync date/time across all other SCHEDULED demos for this lead to prevent conflicting dates
      if (demoDate || demoTime) {
        try {
          const otherScheduledDemos = await prisma.demo.findMany({
            where: {
              leadId,
              status: 'SCHEDULED',
              id: { not: id },
            },
          });

          for (const otherDemo of otherScheduledDemos) {
            const syncedOther = await prisma.demo.update({
              where: { id: otherDemo.id },
              data: {
                ...(demoDate ? { demoDate } : {}),
                ...(demoTime ? { demoTime } : {}),
              },
            });
            syncToFirestore('demos', syncedOther.id, syncedOther).catch(console.warn);
          }
        } catch (e) {}
      }
    }

    syncToFirestore('demos', id, updatedDemo).catch(console.warn);
    if (leadId) {
      if (!updatedLead) {
        try { updatedLead = await prisma.lead.findUnique({ where: { id: leadId } }); } catch (e) {}
      }
      if (updatedLead) {
        syncToFirestore('leads', leadId, updatedLead).catch(console.warn);
      }
    }

    return NextResponse.json(updatedDemo);
  } catch (error: any) {
    console.error('Error updating demo:', error);
    return NextResponse.json({ error: 'Failed to update demo' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingDemo = await prisma.demo.findUnique({
      where: { id },
    });

    if (!existingDemo) {
      return NextResponse.json({ error: 'Demo not found' }, { status: 404 });
    }

    await prisma.demo.delete({
      where: { id },
    });

    deleteFromFirestore('demos', id).catch(console.warn);

    if (existingDemo.leadId) {
      await prisma.activity.create({
        data: {
          leadId: existingDemo.leadId,
          activityType: 'DEMO_DELETED',
          description: `Demo for ${existingDemo.demoDate} was deleted`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: 'Demo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting demo:', error);
    return NextResponse.json({ error: 'Failed to delete demo' }, { status: 500 });
  }
}
