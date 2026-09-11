import { NextResponse } from 'next/server';
import { prisma, ensureDatabaseTables } from '@/lib/prisma';
import { calculateQuotationTotals } from '@/lib/quotationCalculations';
import { generateUniqueQuotationNumber } from '@/lib/quotationNumberGenerator';
import { syncToFirestore } from '@/lib/firebase/firestore';
import { hydrateQuotations } from '@/lib/firebase/hydration';

export async function GET(req: Request) {
  try {
    await ensureDatabaseTables();
    await hydrateQuotations();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'ALL';
    const dateFilter = searchParams.get('dateFilter') || 'all';
    const leadId = searchParams.get('leadId') || '';

    const where: any = {};

    // Status Filter
    if (status !== 'ALL') {
      where.status = status;
    }

    // Lead Filter
    if (leadId) {
      where.leadId = leadId;
    }

    // Search query matching Quotation Number, Lead Name, Company Name, Mobile Number
    if (search.trim()) {
      const query = search.trim();
      where.OR = [
        { quotationNumber: { contains: query } },
        { projectTitle: { contains: query } },
        { lead: { name: { contains: query } } },
        { lead: { company: { contains: query } } },
        { lead: { mobile: { contains: query } } },
      ];
    }

    // Quick Date Filters
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      where.quotationDate = todayStr;
    } else if (dateFilter === 'this_month') {
      const monthPrefix = todayStr.substring(0, 7); // YYYY-MM
      where.quotationDate = { startsWith: monthPrefix };
    }

    let quotations: any[] = [];

    try {
      quotations = await prisma.quotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              mobile: true,
              email: true,
              company: true,
              status: true,
            },
          },
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    } catch (dbErr) {
      console.warn('[GET Quotations DB Error - Fallback to Firestore]:', dbErr);
    }

    if (quotations.length === 0) {
      const { getFirestoreDocs } = await import('@/lib/firebase/firestore');
      const fsQuotations = await getFirestoreDocs('quotations');
      if (fsQuotations && fsQuotations.length > 0) {
        let filtered = fsQuotations.map((q) => ({
          ...q,
          lead: q.lead || { name: 'Lead', mobile: '' },
          items: q.items || [],
        }));
        if (status !== 'ALL') {
          filtered = filtered.filter((q) => q.status === status);
        }
        if (leadId) {
          filtered = filtered.filter((q) => q.leadId === leadId);
        }
        quotations = filtered;
      }
    }

    return NextResponse.json({ quotations });
  } catch (error: any) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations list' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseTables();
    const body = await req.json();
    const {
      leadId,
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
      status = 'DRAFT',
    } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead is required for creating a quotation' }, { status: 400 });
    }
    if (!projectTitle || !projectTitle.trim()) {
      return NextResponse.json({ error: 'Project Title is required' }, { status: 400 });
    }
    if (!quotationDate || !validUntil) {
      return NextResponse.json({ error: 'Quotation Date and Valid Until Date are required' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one quotation item is required' }, { status: 400 });
    }

    // Fetch Lead for Snapshot
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Selected lead not found' }, { status: 404 });
    }

    // Fetch Company Settings for Snapshot
    let companySettings = await prisma.companySetting.findUnique({
      where: { id: 'default' },
    });

    if (!companySettings) {
      companySettings = await prisma.companySetting.create({
        data: {
          id: 'default',
          companyName: 'Neuro Sales CRM',
        },
      });
    }

    // Snapshots
    const clientSnapshot = JSON.stringify({
      id: lead.id,
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email,
      company: lead.company,
      city: lead.city,
    });

    const companySnapshot = JSON.stringify({
      companyName: companySettings.companyName,
      logo: companySettings.logo,
      email: companySettings.email,
      phone: companySettings.phone,
      website: companySettings.website,
      address: companySettings.address,
      gstNumber: companySettings.gstNumber,
    });

    const termsSnapshot = typeof terms === 'string' ? terms : JSON.stringify(terms || []);

    // Server-side safe calculations
    const summary = calculateQuotationTotals(items, overallDiscountType, overallDiscountValue);

    // Generate unique Quotation Number
    const quotationNumber = await generateUniqueQuotationNumber();

    // Create Quotation Record in Transaction
    const newQuotation = await prisma.$transaction(async (tx) => {
      const created = await tx.quotation.create({
        data: {
          leadId,
          quotationNumber,
          projectTitle: projectTitle.trim(),
          projectDescription: projectDescription ? projectDescription.trim() : null,
          currency: currency || 'INR',
          quotationDate,
          validUntil,
          status,
          subtotal: summary.subtotal,
          itemDiscountTotal: summary.itemDiscountTotal,
          overallDiscountType: summary.overallDiscountType,
          overallDiscountValue: summary.overallDiscountValue,
          overallDiscountAmount: summary.overallDiscountAmount,
          taxTotal: summary.taxTotal,
          grandTotal: summary.grandTotal,
          amountInWords: summary.amountInWords,
          paymentTerms: paymentTerms ? paymentTerms.trim() : companySettings.defaultPaymentTerms,
          notes: notes ? notes.trim() : null,
          companySnapshot,
          clientSnapshot,
          termsSnapshot,
          sentAt: status === 'SENT' ? new Date() : null,
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
          lead: true,
          items: true,
        },
      });

      // Update Lead Status to QUOTATION if not CONVERTED
      if (lead.status !== 'CONVERTED') {
        await tx.lead.update({
          where: { id: leadId },
          data: { status: 'QUOTATION' },
        });
      }

      // Record Activity History
      await tx.activity.create({
        data: {
          leadId,
          activityType: status === 'DRAFT' ? 'QUOTATION_DRAFT_CREATED' : 'QUOTATION_CREATED',
          description: `Quotation ${quotationNumber} (${status === 'DRAFT' ? 'Draft' : 'Sent'}) created for ${projectTitle} - Total: ₹${summary.grandTotal.toLocaleString('en-IN')}`,
        },
      });

      return created;
    });

    syncToFirestore('quotations', newQuotation.id, newQuotation).catch(console.warn);

    return NextResponse.json(newQuotation);
  } catch (error: any) {
    console.error('Error creating quotation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create quotation' }, { status: 500 });
  }
}
