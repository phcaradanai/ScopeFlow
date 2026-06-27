import { useMemo, useState } from 'react';
import { AlertTriangle, Calculator, Clipboard, Percent, ReceiptText } from 'lucide-react';
import type { QuotationDraft } from '../lib/ai/quotation/quotationDraft';
import { buildFinalQuoteSummaryMarkdown } from '../lib/ai/quotation/quotationFinalMarkdown';
import { calculateQuotationPricing, type PriceBasis } from '../lib/ai/quotation/quotationPricing';

interface QuotationPriceInputPanelProps {
  draft: QuotationDraft;
}

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function QuotationPriceInputPanel({ draft }: QuotationPriceInputPanelProps) {
  const [priceBasis, setPriceBasis] = useState<PriceBasis>('average_hours');
  const [hourlyRate, setHourlyRate] = useState('0');
  const [manualFixedPrice, setManualFixedPrice] = useState('0');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [taxPercent, setTaxPercent] = useState('7');
  const [paymentTerms, setPaymentTerms] = useState('50% deposit / 50% before delivery');
  const [currency, setCurrency] = useState('THB');

  const result = useMemo(() => calculateQuotationPricing(draft, {
    price_basis: priceBasis,
    hourly_rate: parseNumber(hourlyRate),
    manual_fixed_price: parseNumber(manualFixedPrice),
    discount_percent: parseNumber(discountPercent),
    tax_percent: parseNumber(taxPercent),
    payment_terms: paymentTerms,
    currency,
  }), [draft, priceBasis, hourlyRate, manualFixedPrice, discountPercent, taxPercent, paymentTerms, currency]);

  const finalQuoteSummaryMarkdown = useMemo(() => buildFinalQuoteSummaryMarkdown(result), [result]);

  const copyFinalQuoteSummary = async () => {
    await navigator.clipboard.writeText(finalQuoteSummaryMarkdown);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-3">
        <h3 className="text-sm font-bold text-text flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" /> Quotation Price Input
        </h3>
        <p className="text-xs text-text-muted mt-1">กรอกราคาเอง ระบบช่วยคำนวณจาก man-hour แต่ไม่เดาราคาแทน</p>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-text mb-1 block">Price Basis</label>
            <select value={priceBasis} onChange={(event) => setPriceBasis(event.target.value as PriceBasis)} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary">
              <option value="min_hours">ใช้ชั่วโมงต่ำสุด</option>
              <option value="average_hours">ใช้ชั่วโมงเฉลี่ย</option>
              <option value="max_hours">ใช้ชั่วโมงสูงสุด</option>
              <option value="manual_fixed">กรอก fixed price เอง</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Currency</label>
              <input value={currency} onChange={(event) => setCurrency(event.target.value)} className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Hourly Rate</label>
              <input value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} inputMode="decimal" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
          </div>

          {priceBasis === 'manual_fixed' && (
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Manual Fixed Price</label>
              <input value={manualFixedPrice} onChange={(event) => setManualFixedPrice(event.target.value)} inputMode="decimal" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Discount %</label>
              <input value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} inputMode="decimal" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text mb-1 block">Tax %</label>
              <input value={taxPercent} onChange={(event) => setTaxPercent(event.target.value)} inputMode="decimal" className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-text mb-1 block">Payment Terms</label>
            <textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} className="w-full min-h-[80px] bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text outline-none focus:border-primary resize-y" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Billable Hours</p>
              <p className="text-lg font-bold text-text">{result.billable_hours}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Subtotal</p>
              <p className="text-sm font-bold text-text">{formatMoney(result.subtotal, result.currency)}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Tax</p>
              <p className="text-sm font-bold text-text">{formatMoney(result.tax_amount, result.currency)}</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
              <p className="text-[11px] text-primary-light">Total</p>
              <p className="text-lg font-bold text-primary-light">{formatMoney(result.total, result.currency)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><ReceiptText className="w-4 h-4 text-primary" /> Calculation Summary</h4>
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(result.subtotal, result.currency)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>- {formatMoney(result.discount_amount, result.currency)}</span></div>
              <div className="flex justify-between"><span>Taxable Amount</span><span>{formatMoney(result.taxable_amount, result.currency)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatMoney(result.tax_amount, result.currency)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between text-text font-bold"><span>Total</span><span>{formatMoney(result.total, result.currency)}</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2"><Percent className="w-4 h-4 text-primary" /> Payment Terms</h4>
            <p className="text-xs text-text-muted whitespace-pre-wrap">{result.payment_terms || 'ยังไม่ได้ระบุ payment terms'}</p>
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
              <h4 className="text-xs font-bold text-warning mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Pricing Warnings</h4>
              <ul className="space-y-1 text-xs text-text-muted leading-relaxed list-disc pl-4">
                {result.warnings.map(warning => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-xl border border-primary/20 bg-primary/10 overflow-hidden">
          <div className="p-3 border-b border-primary/20 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-primary-light">Final Quote Summary Markdown</h4>
              <p className="text-[11px] text-text-muted mt-1">copy ส่วนนี้ไปวางใน quotation draft หลังตรวจราคาแล้ว</p>
            </div>
            <button type="button" onClick={copyFinalQuoteSummary} className="btn btn-outline text-xs gap-2 w-full md:w-auto">
              <Clipboard className="w-4 h-4" /> Copy Summary
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-muted font-mono p-3 max-h-[260px] overflow-y-auto">{finalQuoteSummaryMarkdown}</pre>
        </div>
      </div>
    </div>
  );
}
