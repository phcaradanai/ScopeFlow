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
    <div className="flex flex-col h-full bg-gradient-to-b from-[#121214] to-[#09090b] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-10 space-y-10">
        
        {/* Header Section */}
        <div className="bg-white/[0.02] border border-white/10 p-10 rounded-3xl shadow-2xl space-y-8">
          <h3 className="text-base font-bold flex items-center gap-2.5 text-text border-b border-white/10 pb-4">
            <FileText className="w-5 h-5 text-primary" />
            ข้อมูลทั่วไป
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-text-muted mb-2">ชื่อเอกสาร (Title)</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-text placeholder:text-text-dim focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none font-sans text-sm font-medium shadow-sm"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-text-muted mb-2">อ้างอิงขอบเขตงาน (Scope Ref)</label>
              <input
                type="text"
                value={formData.scope_ref}
                onChange={e => handleChange('scope_ref', e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-text placeholder:text-text-dim focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none font-sans text-sm font-medium shadow-sm"
                placeholder="เช่น Scope v1.0"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-semibold text-text-muted mb-2">ยืนราคาถึงวันที่ (Valid Until)</label>
              <input
                type="text"
                value={formData.valid_until}
                onChange={e => handleChange('valid_until', e.target.value)}
                className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-text placeholder:text-text-dim focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none font-sans text-sm font-medium shadow-sm"
                placeholder="เช่น 31 ธันวาคม 2569"
              />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="bg-white/[0.02] border border-white/10 p-10 rounded-3xl shadow-2xl space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
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
            {/* Table Header for Large Screens */}
            <div className="hidden lg:grid grid-cols-12 gap-5 px-6 py-2 text-xs font-bold uppercase tracking-wider text-text-dim">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">รายละเอียดงาน</div>
              <div className="col-span-1 text-right">จำนวน</div>
              <div className="col-span-1 text-center">หน่วย</div>
              <div className="col-span-2 text-right">ราคา/หน่วย</div>
              <div className="col-span-2 text-right pr-2">รวม (บาท)</div>
              <div className="col-span-1"></div>
            </div>

            {formData.line_items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 lg:gap-5 items-center bg-white/[0.01] hover:bg-white/[0.03] p-6 rounded-2xl border border-white/5 hover:border-white/10 shadow-sm transition-all duration-300 group"
              >
                {/* Index */}
                <div className="col-span-12 lg:col-span-1 text-left lg:text-center text-sm font-bold text-text-muted">
                  <span className="lg:hidden text-text-dim text-xs font-bold mr-2 uppercase">รายการที่</span>
                  {index + 1}
                </div>

                {/* Description */}
                <div className="col-span-12 lg:col-span-4">
                  <label className="block lg:hidden text-xs text-text-dim font-bold mb-1.5 uppercase">รายละเอียดงาน</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                    placeholder="รายละเอียดงาน"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-text placeholder:text-text-dim focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-medium"
                  />
                </div>

                {/* Quantity */}
                <div className="col-span-4 lg:col-span-1">
                  <label className="block lg:hidden text-xs text-text-dim font-bold mb-1.5 uppercase">จำนวน</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="จำนวน"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-text placeholder:text-text-dim focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm text-right font-medium"
                  />
                </div>

                {/* Unit */}
                <div className="col-span-4 lg:col-span-1">
                  <label className="block lg:hidden text-xs text-text-dim font-bold mb-1.5 uppercase">หน่วย</label>
                  <input
                    type="text"
                    value={item.unit}
                    onChange={e => handleLineItemChange(item.id, 'unit', e.target.value)}
                    placeholder="หน่วย"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-text placeholder:text-text-dim focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm text-center font-medium"
                  />
                </div>

                {/* Unit Price */}
                <div className="col-span-4 lg:col-span-2">
                  <label className="block lg:hidden text-xs text-text-dim font-bold mb-1.5 uppercase">ราคา/หน่วย</label>
                  <input
                    type="number"
                    min="0"
                    value={item.unit_price}
                    onChange={e => handleLineItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="ราคา/หน่วย"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-text placeholder:text-text-dim focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm text-right font-medium"
                  />
                </div>

                {/* Line Total */}
                <div className="col-span-8 lg:col-span-2 text-right lg:pr-2">
                  <label className="block lg:hidden text-xs text-text-dim font-bold mb-1.5 uppercase">รวม (บาท)</label>
                  <span className="text-base font-bold text-text group-hover:text-primary-light transition-colors font-mono">
                    {(item.quantity * item.unit_price).toLocaleString('th-TH')}
                  </span>
                </div>

                {/* Action button */}
                <div className="col-span-4 lg:col-span-1 flex justify-end">
                  <button
                    onClick={() => removeLineItem(item.id)}
                    disabled={formData.line_items.length === 1}
                    className="p-2 text-text-dim hover:text-error disabled:opacity-30 transition-all hover:scale-105"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-end gap-3 pt-6 border-t border-white/10 mt-6 w-full">
            <div className="flex justify-between w-64 text-sm text-text-muted">
              <span>รวมเป็นเงิน:</span>
              <span className="font-semibold text-text">{totals.subtotal.toLocaleString('th-TH')} บาท</span>
            </div>
            
            <div className="flex justify-between items-center w-full max-w-sm gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-text-muted whitespace-nowrap">หักส่วนลด:</label>
                <select
                  value={formData.discount_type || 'none'}
                  onChange={e => handleChange('discount_type', e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-text focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm cursor-pointer font-medium"
                >
                  <option value="none" className="bg-surface-2">ไม่มี</option>
                  <option value="amount" className="bg-surface-2">จำนวนเงิน (บาท)</option>
                  <option value="percent" className="bg-surface-2">เปอร์เซ็นต์ (%)</option>
                </select>
              </div>
              {(formData.discount_type === 'amount' || formData.discount_type === 'percent') && (
                <input
                  type="number"
                  min="0"
                  max={formData.discount_type === 'percent' ? "100" : undefined}
                  value={formData.discount_value || 0}
                  onChange={e => handleChange('discount_value', parseFloat(e.target.value) || 0)}
                  className="w-32 px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-text focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 outline-none text-right text-sm font-medium"
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
                  className="w-16 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-text focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 outline-none text-right text-sm font-medium"
                />
                <span className="text-sm font-semibold text-text">
                  {totals.vatAmount.toLocaleString('th-TH')}
                </span>
              </div>
            </div>

            <div className="flex justify-between w-64 text-lg font-bold text-text pt-4 border-t border-white/10 mt-2">
              <span>ยอดชำระสุทธิ:</span>
              <span className="text-primary-light font-extrabold text-xl font-mono">{totals.grandTotal.toLocaleString('th-TH')} บาท</span>
            </div>
          </div>
        </div>

        {/* Footer Settings Section */}
        <div className="bg-white/[0.02] border border-white/10 p-10 rounded-3xl shadow-2xl space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-text-muted mb-2">เงื่อนไขการชำระเงิน (Payment Terms)</label>
              {presets?.payment_terms && presets.payment_terms.length > 0 && (
                <div className="mb-4">
                  <select 
                    onChange={e => handleChange('payment_terms_preset', e.target.value)}
                    value={formData.payment_terms_preset}
                    className="w-full px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm text-text focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer font-medium"
                  >
                    <option value="" className="bg-surface-2">-- เลือกแบบฟอร์มเงื่อนไขการชำระเงิน --</option>
                    {presets.payment_terms.map((preset, idx) => (
                      <option key={idx} value={preset} className="bg-surface-2">{preset.substring(0, 50)}...</option>
                    ))}
                  </select>
                </div>
              )}
              <textarea
                value={formData.payment_terms_preset}
                onChange={e => handleChange('payment_terms_preset', e.target.value)}
                rows={3}
                className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-text focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-sm leading-relaxed font-medium"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-text-muted mb-2">หมายเหตุ (Notes)</label>
              <textarea
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-text focus:border-primary/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none text-sm leading-relaxed font-medium"
              />
            </div>
          </div>
        </div>
      </div>
 
      <div className="px-8 py-5 bg-white/[0.02] border-t border-white/10 flex justify-end">
        <button
          onClick={() => onGenerate(formData)}
          className="px-8 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-98"
        >
          สร้าง Markdown จากฟอร์ม
        </button>
      </div>
    </div>
  );
}
