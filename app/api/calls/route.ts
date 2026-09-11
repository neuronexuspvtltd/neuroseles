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

    // Lookup Lead in SQLite first, fallback to Firestore
    let lead: any = null;
    try {
      lead = await prisma.lead.findUnique({ where: { id: leadId } });
    } catch (e) {}

    if (!lead) {
      const { getFirestoreDocs } = await import('@/lib/firebase/firestore');
      const fsLeads = await getFirestoreDocs('leads');
      lead = fsLeads.find((l) => l.id === leadId);
    }

    if (!lead) {
      lead = {
        id: leadId,
        name: 'Lead',
        mobile: '',
        status: 'NEW',
      };
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
      leadUpdateData.convertedAt = now.toISOString();
    }

    if (newStatus === 'NOT_INTERESTED') {
      if (notInterestedReason) leadUpdateData.notInterestedReason = notInterestedReason;
      if (notInterestedNotes) leadUpdateData.notInterestedNotes = notInterestedNotes;
    }

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    let newCall: any = null;
    let updatedLead: any = null;

    try {
      const res = await prisma.$transaction([
        prisma.call.create({
          data: {
            id: callId,
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
      newCall = res[0];
      updatedLead = res[1];
    } catch (dbErr) {
      console.warn('[POST Call DB Error - Fallback to Firestore Sync]:', dbErr);
      newCall = {
        id: callId,
        leadId,
        callDate,
        callTime,
        callResult,
        customerResponse: customerResponse || 'None',
        notes: notes ? notes.trim() : null,
        createdAt: now.toISOString(),
      };
      updatedLead = {
        ...lead,
        ...leadUpdateData,
        updatedAt: now.toISOString(),
      };
    }

    // If Demo Required, automatically create a Demo record if none active
    if (newStatus === 'DEMO') {
      const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      let demoRecord: any = null;

      try {
        const activeDemo = await prisma.demo.findFirst({
          where: { leadId, status: 'SCHEDULED' },
        });

        if (!activeDemo) {
          demoRecord = await prisma.demo.create({
            data: {
              id: demoId,
              leadId,
              demoDate: tomorrowStr,
              demoTime: '16:00',
              duration: '30 mins',
              requirements: lead.initialRequirements || 'Demo requested during phone call',
              notes: notes ? `Call note: ${notes}` : 'Demo requested by client',
              status: 'SCHEDULED',
            },
          });
        }
      } catch (demoDbErr) {
        demoRecord = {
          id: demoId,
          leadId,
          demoDate: tomorrowStr,
          demoTime: '16:00',
          duration: '30 mins',
          requirements: lead.initialRequirements || 'Demo requested during phone call',
          notes: notes ? `Call note: ${notes}` : 'Demo requested by client',
          status: 'SCHEDULED',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
      }

      if (demoRecord) {
        syncToFirestore('demos', demoRecord.id, demoRecord).catch(console.warn);
      }
    }

    syncToFirestore('calls', newCall.id, newCall).catch(console.warn);
    syncToFirestore('leads', leadId, updatedLead).catch(console.warn);

    return NextResponse.json({
      call: newCall,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error('Error saving call record:', error);
    return NextResponse.json({ error: 'Failed to save call record', details: error?.message }, { status: 500 });
  }
}
