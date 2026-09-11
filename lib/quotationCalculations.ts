import { numberToIndianWords } from './numberToWords';

export interface QuotationItemCalculationInput {
  id?: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discountType?: 'FIXED' | 'PERCENTAGE' | string | null;
  discountValue?: number;
  taxRate?: number;
  sortOrder?: number;
}

export interface QuotationItemCalculated {
  id?: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  sortOrder: number;
}

export interface QuotationCalculationSummary {
  items: QuotationItemCalculated[];
  subtotal: number;
  itemDiscountTotal: number;
  overallDiscountType: 'FIXED' | 'PERCENTAGE';
  overallDiscountValue: number;
  overallDiscountAmount: number;
  taxTotal: number;
  grandTotal: number;
  amountInWords: string;
}

function roundMoney(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function calculateQuotationTotals(
  rawItems: QuotationItemCalculationInput[],
  overallDiscountType: 'FIXED' | 'PERCENTAGE' = 'FIXED',
  overallDiscountValue: number = 0
): QuotationCalculationSummary {
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let taxTotal = 0;

  const calculatedItems: QuotationItemCalculated[] = rawItems.map((item, index) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const itemSubtotal = roundMoney(qty * price);

    const discType: 'FIXED' | 'PERCENTAGE' = item.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED';
    const discVal = Math.max(0, Number(item.discountValue) || 0);

    let discAmt = 0;
    if (discType === 'PERCENTAGE') {
      discAmt = roundMoney(itemSubtotal * (discVal / 100));
    } else {
      discAmt = Math.min(itemSubtotal, roundMoney(discVal));
    }

    const taxableAmount = Math.max(0, itemSubtotal - discAmt);
    const taxRate = Math.max(0, Number(item.taxRate) || 0);
    const taxAmt = roundMoney(taxableAmount * (taxRate / 100));
    const total = roundMoney(taxableAmount + taxAmt);

    subtotal += itemSubtotal;
    itemDiscountTotal += discAmt;
    taxTotal += taxAmt;

    return {
      id: item.id,
      name: item.name.trim(),
      description: item.description ? item.description.trim() : null,
      quantity: qty,
      unitPrice: price,
      discountType: discType,
      discountValue: discVal,
      discountAmount: discAmt,
      taxRate: taxRate,
      taxAmount: taxAmt,
      total: total,
      sortOrder: item.sortOrder ?? index,
    };
  });

  subtotal = roundMoney(subtotal);
  itemDiscountTotal = roundMoney(itemDiscountTotal);
  taxTotal = roundMoney(taxTotal);

  const taxableSubtotal = Math.max(0, subtotal - itemDiscountTotal);

  const ovDiscType: 'FIXED' | 'PERCENTAGE' = overallDiscountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED';
  const ovDiscVal = Math.max(0, Number(overallDiscountValue) || 0);
  let overallDiscountAmount = 0;

  if (ovDiscType === 'PERCENTAGE') {
    overallDiscountAmount = roundMoney(taxableSubtotal * (ovDiscVal / 100));
  } else {
    overallDiscountAmount = Math.min(taxableSubtotal, roundMoney(ovDiscVal));
  }

  const grandTotal = Math.max(0, roundMoney(taxableSubtotal - overallDiscountAmount + taxTotal));
  const amountInWords = numberToIndianWords(grandTotal);

  return {
    items: calculatedItems,
    subtotal,
    itemDiscountTotal,
    overallDiscountType: ovDiscType,
    overallDiscountValue: ovDiscVal,
    overallDiscountAmount,
    taxTotal,
    grandTotal,
    amountInWords,
  };
}
