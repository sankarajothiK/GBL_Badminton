/**
 * Formats numbers into the Indian Numbering System (Lakhs and Crores)
 * Example:
 * formatINR(50000) => "₹50,000"
 * formatINR(100000) => "₹1,00,000"
 * formatINR(500000) => "₹5,00,000"
 * formatINR(1250000) => "₹12,50,000"
 */
export function formatINR(amount: number | null | undefined, includeSymbol: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? '₹0' : '0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const numStr = absAmount.toString();

  let formatted = '';
  if (numStr.length <= 3) {
    formatted = numStr;
  } else {
    // Last 3 digits
    const lastThree = numStr.substring(numStr.length - 3);
    // Remaining digits grouped by 2
    const remaining = numStr.substring(0, numStr.length - 3);
    const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formatted = `${withCommas},${lastThree}`;
  }

  const prefix = isNegative ? '-' : '';
  const symbol = includeSymbol ? '₹' : '';
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Compact Indian format for smaller badges or ticker screens
 * e.g. 500000 => "₹5 Lakh", 50000 => "₹50k"
 */
export function formatCompactINR(amount: number | null | undefined): string {
  if (!amount || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}k`;
  }
  return `₹${amount}`;
}

/**
 * Parses user input strings like "50,000", "50000", "₹1,00,000" into a raw number
 */
export function parseINR(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
