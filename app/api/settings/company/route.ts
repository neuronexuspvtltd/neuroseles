import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.companySetting.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.companySetting.create({
        data: {
          id: 'default',
          companyName: 'NEURONEXUS NEXT-GEN INTELLIGENCE',
          logo: '/logo.png',
          email: 'contact@neuronexus.ai',
          phone: '+91 98765 43210',
          website: 'https://neuronexus.ai',
          address: '123 Tech Park, Suite 400, Mumbai, India',
          gstNumber: '27AAAAA0000A1Z5',
          state: 'Maharashtra (27)',
          bankName: 'HDFC BANK',
          accountNumber: '50200012345678',
          ifscCode: 'HDFC0001234',
          branchName: 'Mumbai Branch',
          quotationPrefix: 'QT-',
          defaultCurrency: 'INR',
          defaultGstRate: 18,
          defaultTerms: JSON.stringify([
            '50% advance payment is required before project commencement.',
            'Remaining balance is due upon final project delivery/completion.',
            'Quotation validity is 15 days from the date of issue.',
            'Additional feature requests outside agreed scope will be billed separately.'
          ]),
          defaultPaymentTerms: '50% Advance Payment, 50% upon final project completion.',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json({ error: 'Failed to fetch company settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      logo,
      email,
      phone,
      website,
      address,
      gstNumber,
      state,
      bankName,
      accountNumber,
      ifscCode,
      branchName,
      quotationPrefix,
      defaultCurrency,
      defaultGstRate,
      defaultTerms,
      defaultPaymentTerms,
    } = body;

    const settings = await prisma.companySetting.upsert({
      where: { id: 'default' },
      update: {
        companyName: companyName ? companyName.trim() : undefined,
        logo: logo !== undefined ? logo : undefined,
        email: email ? email.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        website: website ? website.trim() : undefined,
        address: address ? address.trim() : undefined,
        gstNumber: gstNumber ? gstNumber.trim() : undefined,
        state: state ? state.trim() : undefined,
        bankName: bankName ? bankName.trim() : undefined,
        accountNumber: accountNumber ? accountNumber.trim() : undefined,
        ifscCode: ifscCode ? ifscCode.trim() : undefined,
        branchName: branchName ? branchName.trim() : undefined,
        quotationPrefix: quotationPrefix ? quotationPrefix.trim() : undefined,
        defaultCurrency: defaultCurrency || undefined,
        defaultGstRate: defaultGstRate !== undefined ? Number(defaultGstRate) : undefined,
        defaultTerms: defaultTerms !== undefined ? (typeof defaultTerms === 'string' ? defaultTerms : JSON.stringify(defaultTerms)) : undefined,
        defaultPaymentTerms: defaultPaymentTerms ? defaultPaymentTerms.trim() : undefined,
      },
      create: {
        id: 'default',
        companyName: companyName ? companyName.trim() : 'NEURONEXUS NEXT-GEN INTELLIGENCE',
        logo: logo || '/logo.png',
        email,
        phone,
        website,
        address,
        gstNumber,
        state,
        bankName,
        accountNumber,
        ifscCode,
        branchName,
        quotationPrefix: quotationPrefix || 'QT-',
        defaultCurrency: defaultCurrency || 'INR',
        defaultGstRate: Number(defaultGstRate) || 18,
        defaultTerms: typeof defaultTerms === 'string' ? defaultTerms : JSON.stringify(defaultTerms || []),
        defaultPaymentTerms,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating company settings:', error);
    return NextResponse.json({ error: 'Failed to update company settings' }, { status: 500 });
  }
}
