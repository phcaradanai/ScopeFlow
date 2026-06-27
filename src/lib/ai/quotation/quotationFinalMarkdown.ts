import type { QuotationPricingResult } from './quotationPricing';

const START_MARKER = '<!-- final-quote-summary:start -->';
const END_MARKER = '<!-- final-quote-summary:end -->';

function money(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildFinalQuoteSummaryMarkdown(result: QuotationPricingResult): string {
  return `${START_MARKER}
## Final Quote Summary

> ส่วนนี้สร้างจากตัวเลขที่ผู้ใช้กรอกเองใน Quotation Price Input ใช้ตรวจภายในก่อนส่งลูกค้า

- Currency: **${result.currency}**
- Price Basis: **${result.price_basis}**
- Billable Hours: **${result.billable_hours}**
- Hourly Rate: **${money(result.hourly_rate, result.currency)}**
- Subtotal: **${money(result.subtotal, result.currency)}**
- Discount: **${money(result.discount_amount, result.currency)}**
- Taxable Amount: **${money(result.taxable_amount, result.currency)}**
- Tax: **${money(result.tax_amount, result.currency)}**
- Total: **${money(result.total, result.currency)}**

### Payment Terms

${result.payment_terms || 'ยังไม่ได้ระบุ payment terms'}

### Pricing Warnings

${list(result.warnings, 'ไม่มี pricing warning หลัก')}
${END_MARKER}`;
}

export function injectFinalQuoteSummaryMarkdown(markdown: string, result: QuotationPricingResult): string {
  const section = buildFinalQuoteSummaryMarkdown(result);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(markdown)) {
    return markdown.replace(existingSectionPattern, section);
  }

  const quoteStatusHeading = '## Quote Status';
  if (markdown.includes(quoteStatusHeading)) {
    return markdown.replace(quoteStatusHeading, `${section}\n\n${quoteStatusHeading}`);
  }

  return `${markdown.trimEnd()}\n\n${section}\n`;
}
