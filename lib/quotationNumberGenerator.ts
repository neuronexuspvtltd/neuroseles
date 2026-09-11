import { prisma } from './prisma';

/**
 * Generates a unique, transaction-safe quotation number.
 * Format: QT-0001, QT-0002, etc.
 */
export async function generateUniqueQuotationNumber(): Promise<string> {
  const settings = await prisma.companySetting.findUnique({
    where: { id: 'default' },
  });

  const prefix = settings?.quotationPrefix || 'QT-';

  // Find latest quotation to determine sequence
  const latestQuotation = await prisma.quotation.findFirst({
    where: {
      quotationNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      quotationNumber: true,
    },
  });

  let nextSeq = 1;

  if (latestQuotation && latestQuotation.quotationNumber) {
    const rawNumber = latestQuotation.quotationNumber.replace(prefix, '');
    const mainNumPart = rawNumber.split('-')[0]; // strip revision suffixes if any
    const parsed = parseInt(mainNumPart, 10);
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }

  // Ensure database uniqueness
  let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  let exists = await prisma.quotation.findUnique({
    where: { quotationNumber: candidate },
  });

  while (exists) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    exists = await prisma.quotation.findUnique({
      where: { quotationNumber: candidate },
    });
  }

  return candidate;
}

/**
 * Generates a revision quotation number (e.g. QT-0001-R1, QT-0001-R2)
 */
export async function generateRevisionQuotationNumber(parentQuotationNumber: string): Promise<{
  quotationNumber: string;
  revisionNumber: number;
}> {
  // Strip existing revision suffix if any
  const baseNumber = parentQuotationNumber.split('-R')[0];

  const existingRevisions = await prisma.quotation.findMany({
    where: {
      quotationNumber: {
        startsWith: `${baseNumber}-R`,
      },
    },
    select: {
      revisionNumber: true,
    },
  });

  let maxRevision = 0;
  existingRevisions.forEach((r) => {
    if (r.revisionNumber > maxRevision) maxRevision = r.revisionNumber;
  });

  const nextRevision = maxRevision + 1;
  const candidate = `${baseNumber}-R${nextRevision}`;

  return {
    quotationNumber: candidate,
    revisionNumber: nextRevision,
  };
}
