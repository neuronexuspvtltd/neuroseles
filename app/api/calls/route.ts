import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseTables } from '@/lib/prisma';
import { CUSTOMER_RESPONSE_STATUS_MAP, LeadStatus } from '@/lib/statusConfig';
import { format, addDays } from 'date-fns';
import { syncToFirestore } from '@/lib/firebase/firestore';

export async function POST(req: Request) {
  try {
    await ensureDatabaseTables();
    const body = await req.json();
    const {
      leadId,
      callResult,
      customerResponse,
      notes,
      notInterestedReason,
      notInterestedNotes,
    } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }
    if (!callResult) {
      return NextResponse.json({ error: 'Call Result is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const now = new Date();
    const callDate = format(now, 'dd MMM yyyy');
    const callTime = format(now, 'hh:mm a');
    const tomorrowStr = format(addDays(now, 1), 'yyyy-MM-dd');

    // Determine target lead status
    let newStatus: LeadStatus = 'CALLED';
    if (customerResponse && CUSTOMER_RESPONSE_STATUS_MAP[customerResponse]) {
      newStatus = CUSTOMER_RESPONSE_STATUS_MAP[customerResponse];
    } else if (
      callResult === 'Call Not Received' ||
      callResult === 'Busy' ||
      callResult === 'Wrong Number'
    ) {
      newStatus = 'UNREACHABLE';
    }

    const leadUpdateData: any = {
      status: newStatus,
    };

    if (newStatus === 'CONVERTED' && !lead.convertedAt) {
      leadUpdateData.convertedAt = now;
    }

    if (newStatus === 'NOT_INTERESTED') {
      if (notInterestedReason) leadUpdateData.notInterestedReason = notInterestedReason;
      if (notInterestedNotes) leadUpdateData.notInterestedNotes = notInterestedNotes;
    }

    // Save Call record and update Lead
    const [newCall, updatedLead] = await prisma.$transaction([
      prisma.call.create({
        data: {
          leadId,
          callDate,
          callTime,
          callResult,
          customerResponse: customerResponse || 'None',
          notes: notes ? notes.trim() : null,
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: {
          ...leadUpdateData,
          activities: {
            create: [
              {
                activityType: 'CALL_MADE',
                description: `Call Made (${callResult}) - Response: ${customerResponse || 'N/A'}${
                  notes ? ` - ${notes}` : ''
                }`,
              },
              ...(newStatus !== lead.status
                ? [
                    {
                      activityType: 'STATUS_CHANGED',
                      description: `Status changed to ${newStatus.replace('_', ' ')}`,
                    },
                  ]
                : []),
            ],
          },
        },
      }),
    ]);

    // If Demo Required, automatically create a Demo record if none active
    if (newStatus === 'DEMO') {
      const activeDemo = await prisma.demo.findFirst({
        where: { leadId, status: 'SCHEDULED' },
      });

      if (!activeDemo) {
        await prisma.demo.create({
          data: {
            leadId,
            demoDate: tomorrowStr,
            demoTime: '16:00',
            duration: '30 mins',
            requirements: lead.initialRequirements || 'Demo requested during phone call',
            notes: notes ? `Call note: ${notes}` : 'Demo requested by client',
            status: 'SCHEDULED',
          },
        });

        await prisma.activity.create({
          data: {
            leadId,
            activityType: 'DEMO_REQUESTED',
            description: `Demo Record created automatically for ${tomorrowStr} at 16:00`,
          },
        });
      }
    }

    await syncToFirestore('calls', newCall.id, newCall);

    return NextResponse.json({
      call: newCall,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error('Error saving call record:', error);
    return NextResponse.json({ error: 'Failed to save call record', details: error?.message }, { status: 500 });
  }
}
