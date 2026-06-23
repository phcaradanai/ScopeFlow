import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Settings, FileText } from 'lucide-react';
import { QuotationFormData, LineItem, calculateQuotationTotals } from '../lib/quotation-builder';
import { getPresets, Presets } from '../lib/settings';

interface QuotationFormProps {
  workspacePath: string;
  initialData?: QuotationFormData | null;
  onGenerate: (data: QuotationFormData) => void;
}

const defaultData: QuotationFormData = {
  title: 'ใบเสนอราคา',
  scope_ref: '',
  valid_until: '',
  vat_percent: 7,
  discount_type: 'none',
  discount_value: 0,
  notes: '',
  payment_terms_preset: '',
  line_items: [
    { id: '1', description: '', quantity: 1, unit: 'งาน', unit_price: 0 }
  ]
};

export default function QuotationForm({ workspacePath, initialData, onGenerate }: QuotationFormProps) {
  const [formData, setFormData] = useState<QuotationFormData>(initialData || defaultData);
  const [presets, setPresets] = useState<Presets | null>(null);

  useEffect(() => {
    async function loadPresets() {
      const p = await getPresets(workspacePath);
      setPresets(p);
      if (!formData.payment_terms_preset && p.payment_terms.length > 0) {
        handleChange('payment_terms_preset', p.payment_terms[0]);
      }
    }
    loadPresets();
  }, [workspacePath]);

  const handleChange = (field: keyof QuotationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLineItemChange = (id: string, field: keyof LineItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        { id: Math.random().toString(), description: '', quantity: 1, unit: 'งาน', unit_price: 0 }
      ]
    }));
  };

  const removeLineItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter(item => item.id !== id)
    }));
  };

  const totals = calculateQuotationTotals(formData);

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        
        {/* Header Section */}
        <div className="bg-surface-2 border border-border p-8 rounded-2xl shadow-lg space-y-6">
          <h3 className="text-base font-bold flex items-center gap-2.5 text-text border-b border-white/5 pb-4">
            <FileText className="w-5 h-5 text-primary" />
            ข้อมูลทั่วไป
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-text-muted mb-2">ชื่อเอกสาร (Title)</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-sans text-sm shadow-sm"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-text-muted mb-2">อ้างอิงขอบเขตงาน (Scope Ref)</label>
              <input
                type="text"
                value={formData.scope_ref}
                onChange={e => handleChange('scope_ref', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-sans text-sm shadow-sm"
                placeholder="เช่น Scope v1.0"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-text-muted mb-2">ยืนราคาถึงวันที่ (Valid Until)</label>
              <input
                type="text"
                value={formData.valid_until}
                onChange={e => handleChange('valid_until', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-sans text-sm shadow-sm"
                placeholder="เช่น 31 ธันวาคม 2569"
              />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="bg-surface-2 border border-border p-8 rounded-2xl shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-base font-bold flex items-center gap-2.5 text-text">
              <Calculator className="w-5 h-5 text-accent" />
              รายการ (Line Items)
            </h3>
            <button
              onClick={addLineItem}
              className="text-sm font-semibold flex items-center gap-1.5 text-primary-light hover:text-primary transition-colors hover:underline"
            >
              <Plus className="w-4 h-4" /> เพิ่มรายการ
            </button>
          </div>

          <div className="space-y-4">
            {formData.line_items.map((item, index) => (
              <div key={item.id} className="flex flex-wrap sm:flex-nowrap gap-4 items-center bg-surface p-4.5 rounded-xl border border-border/80 shadow-sm">
                <div className="w-full sm:w-10 text-center text-sm font-semibold text-text-muted">{index + 1}</div>
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                    placeholder="รายละเอียดงาน"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="จำนวน"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm text-right"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="text"
                    value={item.unit}
                    onChange={e => handleLineItemChange(item.id, 'unit', e.target.value)}
                    placeholder="หน่วย"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm text-center"
                  />
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="0"
                    value={item.unit_price}
                    onChange={e => handleLineItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="ราคา/หน่วย"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm text-right"
                  />
                </div>
                <div className="w-32 text-right font-bold text-text">
                  {(item.quantity * item.unit_price).toLocaleString('th-TH')}
                </div>
                <button
                  onClick={() => removeLineItem(item.id)}
                  disabled={formData.line_items.length === 1}
                  className="p-2.5 text-text-dim hover:text-error disabled:opacity-30 transition-all hover:scale-105"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-end gap-2 pt-4 border-t border-border mt-4">
            <div className="flex justify-between w-64 text-sm text-text-muted">
              <span>รวมเป็นเงิน:</span>
              <span>{totals.subtotal.toLocaleString('th-TH')} บาท</span>
            </div>
            
            <div className="flex justify-between items-center w-full max-w-sm gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-muted whitespace-nowrap">หักส่วนลด:</label>
                <select
                  value={formData.discount_type || 'none'}
                  onChange={e => handleChange('discount_type', e.target.value)}
                  className="px-2 py-1 rounded-lg bg-surface border border-border focus:border-primary text-sm"
                >
                  <option value="none">ไม่มี</option>
                  <option value="amount">จำนวนเงิน (บาท)</option>
                  <option value="percent">เปอร์เซ็นต์ (%)</option>
                </select>
              </div>
              {(formData.discount_type === 'amount' || formData.discount_type === 'percent') && (
                <input
                  type="number"
                  min="0"
                  max={formData.discount_type === 'percent' ? "100" : undefined}
                  value={formData.discount_value || 0}
                  onChange={e => handleChange('discount_value', parseFloat(e.target.value) || 0)}
                  className="w-32 px-3 py-1 rounded-lg bg-surface border border-border focus:border-primary text-right"
                />
              )}
            </div>
            
            <div className="flex justify-between items-center w-full max-w-sm gap-4">
              <label className="text-sm font-semibold text-text-muted whitespace-nowrap flex items-center gap-1.5">
                VAT (%) <Settings className="w-3.5 h-3.5 text-text-dim" />
              </label>
              <div className="flex items-center gap-4 w-32 justify-end">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.vat_percent}
                  onChange={e => handleChange('vat_percent', parseFloat(e.target.value) || 0)}
                  className="w-16 px-3 py-1.5 rounded-xl bg-surface border border-border text-text focus:border-primary text-right outline-none text-sm"
                />
                <span className="text-sm font-semibold text-text">
                  {totals.vatAmount.toLocaleString('th-TH')}
                </span>
              </div>
            </div>

            <div className="flex justify-between w-64 text-lg font-bold text-text pt-4 border-t border-border">
              <span>ยอดชำระสุทธิ:</span>
              <span className="text-primary-light font-extrabold text-xl">{totals.grandTotal.toLocaleString('th-TH')} บาท</span>
            </div>
          </div>
        </div>

        {/* Footer Settings Section */}
        <div className="bg-surface-2 border border-border p-8 rounded-2xl shadow-lg space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-text-muted mb-2">เงื่อนไขการชำระเงิน (Payment Terms)</label>
              {presets?.payment_terms && presets.payment_terms.length > 0 && (
                <div className="mb-3">
                  <select 
                    onChange={e => handleChange('payment_terms_preset', e.target.value)}
                    value={formData.payment_terms_preset}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-sm focus:border-primary outline-none cursor-pointer text-text"
                  >
                    <option value="">-- เลือกแบบฟอร์มเงื่อนไขการชำระเงิน --</option>
                    {presets.payment_terms.map((preset, idx) => (
                      <option key={idx} value={preset}>{preset.substring(0, 50)}...</option>
                    ))}
                  </select>
                </div>
              )}
              <textarea
                value={formData.payment_terms_preset}
                onChange={e => handleChange('payment_terms_preset', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-sm leading-relaxed"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-text-muted mb-2">หมายเหตุ (Notes)</label>
              <textarea
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
 
      <div className="px-8 py-5 bg-surface-2 border-t border-border flex justify-end">
        <button
          onClick={() => onGenerate(formData)}
          className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          สร้าง Markdown จากฟอร์ม
        </button>
      </div>
    </div>
  );
}
