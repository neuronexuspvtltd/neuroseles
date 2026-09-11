/**
 * Converts a monetary number to Indian Rupees in words.
 * Handles Crores, Lakhs, Thousands, Hundreds, and Paise.
 * Example: 125000 -> "One Lakh Twenty-Five Thousand Rupees Only"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertTwoDigits(num: number): string {
  if (num < 20) return ones[num];
  const tenDigit = Math.floor(num / 10);
  const oneDigit = num % 10;
  return `${tens[tenDigit]}${oneDigit > 0 ? '-' + ones[oneDigit] : ''}`;
}

function convertThreeDigits(num: number): string {
  const hundredDigit = Math.floor(num / 100);
  const remainder = num % 100;
  let str = '';
  if (hundredDigit > 0) {
    str += `${ones[hundredDigit]} Hundred`;
  }
  if (remainder > 0) {
    str += `${str ? ' ' : ''}${convertTwoDigits(remainder)}`;
  }
  return str;
}

export function numberToIndianWords(amount: number): string {
  if (amount === 0 || isNaN(amount)) return 'Zero Rupees Only';

  const roundedAmount = Math.round(amount * 100) / 100;
  const rupees = Math.floor(roundedAmount);
  const paise = Math.round((roundedAmount - rupees) * 100);

  let parts: string[] = [];

  let num = rupees;

  // Crores (10,00,00,000)
  const crores = Math.floor(num / 10000000);
  if (crores > 0) {
    parts.push(`${convertThreeDigits(crores)} Crore`);
    num %= 10000000;
  }

  // Lakhs (1,00,000)
  const lakhs = Math.floor(num / 100000);
  if (lakhs > 0) {
    parts.push(`${convertTwoDigits(lakhs)} Lakh`);
    num %= 100000;
  }

  // Thousands (1,000)
  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    parts.push(`${convertTwoDigits(thousands)} Thousand`);
    num %= 1000;
  }

  // Hundreds & Remaining
  if (num > 0) {
    parts.push(convertThreeDigits(num));
  }

  let rupeesStr = parts.join(' ').trim();
  if (!rupeesStr) rupeesStr = 'Zero';

  let result = `${rupeesStr} Rupees`;
  if (paise > 0) {
    result += ` and ${convertTwoDigits(paise)} Paise`;
  }
  result += ' Only';

  return result;
}
