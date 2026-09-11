import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateQuotationTotals } from '@/lib/quotationCalculations';
import { generateRevisionQuotationNumber } from '@/lib/quotationNumberGenerator';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            calls: { orderBy: { createdAt: 'desc' } },
            followUps: { orderBy: { createdAt: 'desc' } },
            demos: { orderBy: { createdAt: 'desc' } },
            activities: { orderBy: { createdAt: 'desc' } },
          },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        parentQuotation: {
          select: {
            id: true,
            quotationNumber: true,
            status: true,
            grandTotal: true,
          },
        },
        revisions: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            quotationNumber: true,
            status: true,
            grandTotal: true,
            createdAt: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error: any) {
    console.error('Error fetching quotation detail:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation detail' }, { status: 500 });
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
      status,
      rejectionReason,
      rejectionNotes,
      projectTitle,
      projectDescription,
      quotationDate,
      validUntil,
      currency,
      items,
      overallDiscountType,
      overallDiscountValue,
      paymentTerms,
      terms,
      notes,
    } = body;

    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { lead: true, items: true },
    });

    if (!existingQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const leadId = existingQuotation.leadId;

    // ACTION: MARK AS SENT
    if (action === 'MARK_SENT' || status === 'SENT') {
      const updated = await prisma.$transaction([
        prisma.quotation.update({
          where: { id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        }),
        prisma.activity.create({
          data: {
            leadId,
            activityType: 'QUOTATION_SENT',
            description: `Quotation ${existingQuotation.quotationNumber} marked as Sent to client`,
          },
        }),
      ]);
      return NextResponse.json(updated[0]);
    }

    // ACTION: MARK AS ACCEPTED -> CONVERTS LEAD TO CLIENT!
    if (action === 'ACCEPT' || status === 'ACCEPTED') {
      const lead = existingQuotation.lead;
      
      const updatedQuotation = await prisma.quotation.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      if (lead) {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            status: 'CONVERTED',
            convertedAt: new Date(),
          },
        });

        // Check if Client already exists for this Lead
        let existingClient = await prisma.client.findUnique({
          where: { leadId },
        });

        if (!existingClient) {
          // Check by normalizedMobile as fallback safeguard
          existingClient = await prisma.client.findUnique({
            where: { normalizedMobile: lead.normalizedMobile },
          });

          if (existingClient && !existingClient.leadId) {
            // Link unlinked manual client to this lead
            existingClient = await prisma.client.update({
              where: { id: existingClient.id },
              data: { leadId: lead.id },
            });
          }
        }

        if (!existingClient) {
          // Create new Client record from Lead snapshot
          existingClient = await prisma.client.create({
            data: {
              leadId: lead.id,
              name: lead.name,
              mobile: lead.mobile,
              normalizedMobile: lead.normalizedMobile,
              email: lead.email,
              company: lead.company,
              city: lead.city,
              status: 'ACTIVE',
              notes: lead.notes,
              projects: existingQuotation.projectTitle ? {
                create: {
                  name: existingQuotation.projectTitle,
                  type: 'Custom Development',
                  description: existingQuotation.projectDescription || null,
                  requirements: lead.initialRequirements || null,
                  status: 'IN_PROGRESS',
                  startDate: new Date().toISOString().split('T')[0],
                  requirementHistories: lead.initialRequirements ? {
                    create: {
                      requirements: lead.initialRequirements,
                      changeDescription: 'Initial requirements imported from Lead during Client conversion',
                    }
                  } : undefined
                }
              } : undefined
            },
          });

          await prisma.activity.create({
            data: {
              leadId,
              clientId: existingClient.id,
              activityType: 'CLIENT_CREATED',
              description: `Client "${existingClient.name}" created automatically from accepted Quotation ${existingQuotation.quotationNumber}`,
            },
          });
        }

        await prisma.activity.create({
          data: {
            leadId,
            clientId: existingClient.id,
            activityType: 'QUOTATION_ACCEPTED',
            description: `Quotation ${existingQuotation.quotationNumber} ACCEPTED! Lead converted to Client 🎉`,
          },
        });
      }

      return NextResponse.json(updatedQuotation);
    }

    // ACTION: MARK AS REJECTED
    if (action === 'REJECT' || status === 'REJECTED') {
      const [updatedQuotation] = await prisma.$transaction([
        prisma.quotation.update({
          where: { id },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            rejectionReason: rejectionReason || null,
            rejectionNotes: rejectionNotes || null,
          },
        }),
        prisma.activity.create({
          data: {
            leadId,
            activityType: 'QUOTATION_REJECTED',
            description: `Quotation ${existingQuotation.quotationNumber} Rejected${rejectionReason ? ` (Reason: ${rejectionReason})` : ''}`,
          },
        }),
      ]);

      return NextResponse.json(updatedQuotation);
    }

    // ACTION: CREATE REVISION (QT-0001-R1)
    if (action === 'REVISE') {
      const { quotationNumber: revisionNumberStr, revisionNumber } = await generateRevisionQuotationNumber(
        existingQuotation.quotationNumber
      );

      const itemsToCopy = items && Array.isArray(items) && items.length > 0 ? items : existingQuotation.items;
      const summary = calculateQuotationTotals(
        itemsToCopy,
        overallDiscountType !== undefined ? overallDiscountType : existingQuotation.overallDiscountType,
        overallDiscountValue !== undefined ? overallDiscountValue : existingQuotation.overallDiscountValue
      );

      const [oldQuotation, newRevision] = await prisma.$transaction([
        prisma.quotation.update({
          where: { id },
          data: {
            status: 'REVISED',
          },
        }),
        prisma.quotation.create({
          data: {
            leadId,
            quotationNumber: revisionNumberStr,
            parentQuotationId: id,
            revisionNumber,
            projectTitle: projectTitle || existingQuotation.projectTitle,
            projectDescription: projectDescription !== undefined ? projectDescription : existingQuotation.projectDescription,
            currency: currency || existingQuotation.currency,
            quotationDate: quotationDate || new Date().toISOString().split('T')[0],
            validUntil: validUntil || existingQuotation.validUntil,
            status: 'DRAFT',
            subtotal: summary.subtotal,
            itemDiscountTotal: summary.itemDiscountTotal,
            overallDiscountType: summary.overallDiscountType,
            overallDiscountValue: summary.overallDiscountValue,
            overallDiscountAmount: summary.overallDiscountAmount,
            taxTotal: summary.taxTotal,
            grandTotal: summary.grandTotal,
            amountInWords: summary.amountInWords,
            paymentTerms: paymentTerms !== undefined ? paymentTerms : existingQuotation.paymentTerms,
            notes: notes !== undefined ? notes : existingQuotation.notes,
            companySnapshot: existingQuotation.companySnapshot,
            clientSnapshot: existingQuotation.clientSnapshot,
            termsSnapshot: typeof terms === 'string' ? terms : (terms ? JSON.stringify(terms) : existingQuotation.termsSnapshot),
            items: {
              create: summary.items.map((item, idx) => ({
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountType: item.discountType,
                discountValue: item.discountValue,
                discountAmount: item.discountAmount,
                taxRate: item.taxRate,
                taxAmount: item.taxAmount,
                total: item.total,
                sortOrder: idx,
              })),
            },
          },
          include: {
            items: true,
          },
        }),
        prisma.activity.create({
          data: {
            leadId,
            activityType: 'QUOTATION_REVISED',
            description: `Created Revision ${revisionNumberStr} for Quotation ${existingQuotation.quotationNumber}`,
          },
        }),
      ]);

      return NextResponse.json({ oldQuotation, newRevision });
    }

    // ACTION: DUPLICATE QUOTATION
    if (action === 'DUPLICATE') {
      const settings = await prisma.companySetting.findUnique({ where: { id: 'default' } });
      const prefix = settings?.quotationPrefix || 'QT-';
      
      const latest = await prisma.quotation.findFirst({
        where: { quotationNumber: { startsWith: prefix } },
        orderBy: { createdAt: 'desc' },
      });
      let nextSeq = 1;
      if (latest) {
        const raw = latest.quotationNumber.replace(prefix, '').split('-')[0];
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed)) nextSeq = parsed + 1;
      }
      const newNum = `${prefix}${String(nextSeq).padStart(4, '0')}`;

      const summary = calculateQuotationTotals(
        existingQuotation.items,
        existingQuotation.overallDiscountType as any,
        existingQuotation.overallDiscountValue
      );

      const duplicated = await prisma.quotation.create({
        data: {
          leadId,
          quotationNumber: newNum,
          projectTitle: `Copy of ${existingQuotation.projectTitle}`,
          projectDescription: existingQuotation.projectDescription,
          currency: existingQuotation.currency,
          quotationDate: new Date().toISOString().split('T')[0],
          validUntil: existingQuotation.validUntil,
          status: 'DRAFT',
          subtotal: summary.subtotal,
          itemDiscountTotal: summary.itemDiscountTotal,
          overallDiscountType: summary.overallDiscountType,
          overallDiscountValue: summary.overallDiscountValue,
          overallDiscountAmount: summary.overallDiscountAmount,
          taxTotal: summary.taxTotal,
          grandTotal: summary.grandTotal,
          amountInWords: summary.amountInWords,
          paymentTerms: existingQuotation.paymentTerms,
          notes: existingQuotation.notes,
          companySnapshot: existingQuotation.companySnapshot,
          clientSnapshot: existingQuotation.clientSnapshot,
          termsSnapshot: existingQuotation.termsSnapshot,
          items: {
            create: summary.items.map((item, idx) => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountType: item.discountType,
              discountValue: item.discountValue,
              discountAmount: item.discountAmount,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              total: item.total,
              sortOrder: idx,
            })),
          },
        },
        include: { items: true },
      });

      await prisma.activity.create({
        data: {
          leadId,
          activityType: 'QUOTATION_DUPLICATED',
          description: `Duplicated Quotation ${existingQuotation.quotationNumber} to new draft ${newNum}`,
        },
      });

      return NextResponse.json(duplicated);
    }

    // GENERAL UPDATE (For Drafts or general edits)
    const updateData: any = {};
    if (projectTitle) updateData.projectTitle = projectTitle.trim();
    if (projectDescription !== undefined) updateData.projectDescription = projectDescription ? projectDescription.trim() : null;
    if (quotationDate) updateData.quotationDate = quotationDate;
    if (validUntil) updateData.validUntil = validUntil;
    if (currency) updateData.currency = currency;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    if (terms) updateData.termsSnapshot = typeof terms === 'string' ? terms : JSON.stringify(terms);

    if (items && Array.isArray(items) && items.length > 0) {
      const summary = calculateQuotationTotals(
        items,
        overallDiscountType !== undefined ? overallDiscountType : existingQuotation.overallDiscountType,
        overallDiscountValue !== undefined ? overallDiscountValue : existingQuotation.overallDiscountValue
      );

      updateData.subtotal = summary.subtotal;
      updateData.itemDiscountTotal = summary.itemDiscountTotal;
      updateData.overallDiscountType = summary.overallDiscountType;
      updateData.overallDiscountValue = summary.overallDiscountValue;
      updateData.overallDiscountAmount = summary.overallDiscountAmount;
      updateData.taxTotal = summary.taxTotal;
      updateData.grandTotal = summary.grandTotal;
      updateData.amountInWords = summary.amountInWords;

      // Delete existing items & replace with calculated updated items
      await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
      updateData.items = {
        create: summary.items.map((item, idx) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountType: item.discountType,
          discountValue: item.discountValue,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          total: item.total,
          sortOrder: idx,
        })),
      };
    }

    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: updateData,
      include: { items: true, lead: true },
    });

    return NextResponse.json(updatedQuotation);
  } catch (error: any) {
    console.error('Error updating quotation:', error);
    return NextResponse.json({ error: error.message || 'Failed to update quotation' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!existingQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.quotationItem.deleteMany({ where: { quotationId: id } }),
      prisma.quotation.delete({ where: { id } }),
    ]);

    if (existingQuotation.leadId) {
      await prisma.activity.create({
        data: {
          leadId: existingQuotation.leadId,
          activityType: 'QUOTATION_DELETED',
          description: `Quotation ${existingQuotation.quotationNumber} was deleted`,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  }
}
