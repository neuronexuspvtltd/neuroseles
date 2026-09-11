import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, followUpDate, followUpTime, note } = body;

    const existingFollowUp = await prisma.followUp.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!existingFollowUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    if (action === 'COMPLETE') {
      const [updatedFollowUp] = await prisma.$transaction([
        prisma.followUp.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        }),
        prisma.activity.create({
          data: {
            leadId: existingFollowUp.leadId,
            activityType: 'FOLLOW_UP_COMPLETED',
            description: `Follow-up Completed - Note: ${existingFollowUp.note}`,
          },
        }),
      ]);

      return NextResponse.json(updatedFollowUp);
    }

    if (action === 'RESCHEDULE') {
      if (!followUpDate || !followUpTime || !note) {
        return NextResponse.json(
          { error: 'Date, Time, and Note are required for rescheduling' },
          { status: 400 }
        );
      }

      // Mark current follow-up as RESCHEDULED / COMPLETED and create a new follow-up record to retain history!
      const [oldFollowUp, newFollowUp] = await prisma.$transaction([
        prisma.followUp.update({
          where: { id },
          data: {
            status: 'RESCHEDULED',
            completedAt: new Date(),
          },
        }),
        prisma.followUp.create({
          data: {
            leadId: existingFollowUp.leadId,
            followUpDate,
            followUpTime,
            note: note.trim(),
            status: 'PENDING',
          },
        }),
        prisma.lead.update({
          where: { id: existingFollowUp.leadId },
          data: {
            status: 'FOLLOW_UP',
            activities: {
              create: [
                {
                  activityType: 'FOLLOW_UP_RESCHEDULED',
                  description: `Follow-up Rescheduled from ${existingFollowUp.followUpDate} to ${followUpDate} at ${followUpTime} - Note: ${note.trim()}`,
                },
              ],
            },
          },
        }),
      ]);

      return NextResponse.json({ oldFollowUp, newFollowUp });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 });
  }
}
