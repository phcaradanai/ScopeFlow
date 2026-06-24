import YAML from 'yaml';
import { CompanyProfile } from './settings';

export interface LineItem {
  id: string; // for react keys
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export interface QuotationFormData {
  title: string;
  scope_ref: string;
  valid_until: string;
  vat_percent: number;
  discount?: number; // legacy
  discount_type?: 'none' | 'amount' | 'percent';
  discount_value?: number;
  notes: string;
  payment_terms_preset: string; // the string value of the preset
  line_items: LineItem[];
}

export interface QuotationTotals {
  subtotal: number;
  discount: number;
  subtotalAfterDiscount: number;
  vatAmount: number;
  grandTotal: number;
}

export function calculateQuotationTotals(data: QuotationFormData): QuotationTotals {
  const subtotal = data.line_items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0);
  
  let discountAmount = 0;
  const dType = data.discount_type || (data.discount !== undefined ? 'amount' : 'none');
  const dVal = Math.max(0, Number(data.discount_value !== undefined ? data.discount_value : data.discount) || 0);

  if (dType === 'amount') {
    discountAmount = Math.min(dVal, subtotal);
  } else if (dType === 'percent') {
    const percent = Math.min(100, Math.max(0, dVal));
    discountAmount = subtotal * (percent / 100);
  }

  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const vatAmount = (subtotalAfterDiscount * Math.max(0, Number(data.vat_percent) || 0)) / 100;
  const grandTotal = subtotalAfterDiscount + vatAmount;

  return {
    subtotal,
    discount: discountAmount,
    subtotalAfterDiscount,
    vatAmount,
    grandTotal,
  };
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateQuotationMarkdown(
  data: QuotationFormData,
  companyProfile: CompanyProfile | null,
  clientName: string,
  projectName: string,
  documentId: string
): string {
  const totals = calculateQuotationTotals(data);
  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  // Normalize data for frontmatter saving
  const normalizedData = { ...data };
  if (normalizedData.discount !== undefined) {
    if (!normalizedData.discount_type) {
      normalizedData.discount_type = 'amount';
      normalizedData.discount_value = normalizedData.discount;
    }
    delete normalizedData.discount;
  }
  if (!normalizedData.discount_type) {
    normalizedData.discount_type = 'none';
    normalizedData.discount_value = 0;
  }

  const frontmatter = {
    title: normalizedData.title || 'ใบเสนอราคา (Quotation)',
    type: 'quotation',
    id: documentId,
    form_data: normalizedData,
  };
  const yamlString = YAML.stringify(frontmatter).trim();

  let markdown = `---\n${yamlString}\n---\n\n`;

  markdown += `# ${frontmatter.title}\n\n`;

  // Provider Info
  if (companyProfile && companyProfile.provider_name) {
    markdown += `**ผู้ให้บริการ (Provider):** ${companyProfile.provider_name}\n`;
    if (companyProfile.address) markdown += `${companyProfile.address}\n`;
    if (companyProfile.tax_id) markdown += `เลขประจำตัวผู้เสียภาษี: ${companyProfile.tax_id}\n`;
    const contacts = [];
    if (companyProfile.contact_name) contacts.push(`ติดต่อ: ${companyProfile.contact_name}`);
    if (companyProfile.phone) contacts.push(`โทร: ${companyProfile.phone}`);
    if (companyProfile.email) contacts.push(`อีเมล: ${companyProfile.email}`);
    if (contacts.length > 0) markdown += contacts.join(' | ') + '\n';
    markdown += `\n`;
  }

  // Client Info
  markdown += `**ลูกค้า (Client):** ${clientName}\n`;
  markdown += `**โครงการ (Project):** ${projectName}\n`;
  if (data.scope_ref) markdown += `**อ้างอิงขอบเขตงาน:** ${data.scope_ref}\n`;
  markdown += `**วันที่:** ${today}\n`;
  if (data.valid_until) markdown += `**ยืนราคาถึงวันที่:** ${data.valid_until}\n`;
  markdown += `\n---\n\n`;

  // Line Items Table
  markdown += `### รายการ (Line Items)\n\n`;
  markdown += `| ลำดับ | รายการ | จำนวน | หน่วย | ราคา/หน่วย | จำนวนเงิน |\n`;
  markdown += `| :---: | :--- | :---: | :---: | :---: | :---: |\n`;

  data.line_items.forEach((item, index) => {
    const amount = item.quantity * item.unit_price;
    markdown += `| ${index + 1} | ${item.description || '-'} | ${item.quantity} | ${item.unit || '-'} | ${formatCurrency(item.unit_price)} | ${formatCurrency(amount)} |\n`;
  });
  
  markdown += `\n`;

  // Totals
  markdown += `### สรุปยอดเงิน (Summary)\n\n`;
  markdown += `| รายการ | จำนวนเงิน (บาท) |\n`;
  markdown += `| :--- | :---: |\n`;
  markdown += `| **รวมเป็นเงิน (Subtotal)** | ${formatCurrency(totals.subtotal)} |\n`;
  if (totals.discount > 0) {
    const dType = data.discount_type || (data.discount !== undefined ? 'amount' : 'none');
    const dVal = data.discount_value !== undefined ? data.discount_value : (data.discount || 0);
    let discountLabel = '**หักส่วนลด (Discount)**';
    if (dType === 'percent') {
      discountLabel = `**หักส่วนลด ${dVal}% (Discount)**`;
    }
    markdown += `| ${discountLabel} | -${formatCurrency(totals.discount)} |\n`;
    markdown += `| **ยอดหลังหักส่วนลด** | ${formatCurrency(totals.subtotalAfterDiscount)} |\n`;
  }
  markdown += `| **ภาษีมูลค่าเพิ่ม (VAT ${data.vat_percent}%)** | ${formatCurrency(totals.vatAmount)} |\n`;
  markdown += `| **ยอดชำระสุทธิ (Grand Total)** | **${formatCurrency(totals.grandTotal)}** |\n`;
  markdown += `\n---\n\n`;

  // Payment Terms
  if (data.payment_terms_preset) {
    markdown += `### เงื่อนไขการชำระเงิน (Payment Terms)\n\n`;
    markdown += `${data.payment_terms_preset}\n\n`;
  }

  // Notes
  if (data.notes) {
    markdown += `### หมายเหตุ (Notes)\n\n`;
    markdown += `${data.notes}\n\n`;
  }

  return markdown;
}

export function parseQuotationFormData(markdown: string): QuotationFormData | null {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n+/;
  const match = markdown.match(frontmatterRegex);
  if (!match) return null;

  try {
    const parsed = YAML.parse(match[1]);
    if (parsed && parsed.form_data) {
      const fd = parsed.form_data as QuotationFormData;
      // Migration logic
      if (fd.discount !== undefined && fd.discount_type === undefined) {
        fd.discount_type = 'amount';
        fd.discount_value = fd.discount;
        delete fd.discount;
      }
      return fd;
    }
  } catch (err) {
    console.error("Failed to parse frontmatter data:", err);
  }
  return null;
}
