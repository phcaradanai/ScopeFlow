import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Settings, FileText } from 'lucide-react';
import { QuotationFormData, LineItem, calculateQuotationTotals } from '../lib/quotation-builder';
import { getPresets, Presets } from '../lib/settings';
import SelectField from './ui/SelectField';

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
      setFormData(prev => {
        if (!prev.payment_terms_preset && p.payment_terms.length > 0) {
          return { ...prev, payment_terms_preset: p.payment_terms[0] };
        }
        return prev;
      });
    }
    loadPresets();
  }, [workspacePath]);

  function handleChange(field: keyof QuotationFormData, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">
          
          {/* Header Section */}
          <div className="card space-y-8">
            <div className="border-b border-white/10 pb-5">
              <h3 className="text-lg font-bold flex items-center gap-3 text-text">
                <FileText className="w-5 h-5 text-primary" />
                ข้อมูลทั่วไป
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="form-label">ชื่อเอกสาร (Title)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">อ้างอิงขอบเขตงาน (Scope Ref)</label>
                <input
                  type="text"
                  value={formData.scope_ref}
                  onChange={e => handleChange('scope_ref', e.target.value)}
                  className="form-input"
                  placeholder="เช่น Scope v1.0"
                />
              </div>
              <div>
                <label className="form-label">ยืนราคาถึงวันที่ (Valid Until)</label>
                <input
                  type="text"
                  value={formData.valid_until}
                  onChange={e => handleChange('valid_until', e.target.value)}
                  className="form-input"
                  placeholder="เช่น 31 ธันวาคม 2569"
                />
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="card space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-3 text-text">
                  <Calculator className="w-5 h-5 text-accent" />
                  รายการ (Line Items)
                </h3>
                <p className="text-xs text-text-dim mt-1 font-medium">เพิ่มรายการงานและราคาต่อหน่วย</p>
              </div>
              <button
                onClick={addLineItem}
                className="btn btn-sm text-primary bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white hover:border-primary"
              >
                <Plus className="w-4 h-4" /> เพิ่มรายการ
              </button>
            </div>

            <div className="space-y-4">
              {/* Table Header for Large Screens */}
              <div className="hidden lg:grid grid-cols-12 gap-5 px-6 py-3 text-xs font-bold uppercase tracking-wider text-text-dim">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-4">รายละเอียดงาน</div>
                <div className="col-span-1 text-right">จำนวน</div>
                <div className="col-span-1 text-center">หน่วย</div>
                <div className="col-span-2 text-right">ราคา/หน่วย</div>
                <div className="col-span-2 text-right">รวม (บาท)</div>
                <div className="col-span-1"></div>
              </div>

              {formData.line_items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 lg:gap-5 items-center bg-white/[0.01] hover:bg-white/[0.03] p-4 lg:p-6 rounded-2xl border border-white/5 hover:border-white/10 shadow-sm transition-all duration-300 group"
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
                      className="form-input"
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
                      className="form-input text-right"
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
                      className="form-input text-center"
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
                      className="form-input text-right"
                    />
                  </div>

                  {/* Line Total */}
                  <div className="col-span-8 lg:col-span-2 text-right">
                    <label className="block lg:hidden text-xs text-text-dim font-bold mb-1.5 uppercase">รวม (บาท)</label>
                    <span className="text-base font-bold text-text font-mono py-2.5 block">
                      {(item.quantity * item.unit_price).toLocaleString('th-TH')}
                    </span>
                  </div>

                  {/* Action button */}
                  <div className="col-span-4 lg:col-span-1 flex justify-end">
                    <button
                      onClick={() => removeLineItem(item.id)}
                      disabled={formData.line_items.length === 1}
                      className="btn btn-icon text-text-dim hover:text-error disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end gap-4 pt-8 border-t border-white/10">
              <div className="flex justify-between w-full max-w-sm text-sm text-text-muted">
                <span>รวมเป็นเงิน:</span>
                <span className="font-semibold text-text">{totals.subtotal.toLocaleString('th-TH')} บาท</span>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full max-w-sm">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-text-muted whitespace-nowrap font-medium">หักส่วนลด:</label>
                  <SelectField
                    value={formData.discount_type || 'none'}
                    onChange={val => handleChange('discount_type', val)}
                    options={[
                      { value: 'none', label: 'ไม่มี' },
                      { value: 'amount', label: 'จำนวนเงิน (บาท)' },
                      { value: 'percent', label: 'เปอร์เซ็นต์ (%)' },
                    ]}
                    className="sm:w-44"
                  />
                </div>
                {(formData.discount_type === 'amount' || formData.discount_type === 'percent') && (
                  <input
                    type="number"
                    min="0"
                    max={formData.discount_type === 'percent' ? "100" : undefined}
                    value={formData.discount_value || 0}
                    onChange={e => handleChange('discount_value', parseFloat(e.target.value) || 0)}
                    className="form-input w-32"
                  />
                )}
              </div>
              
              <div className="flex justify-between items-center w-full max-w-sm gap-4">
                <label className="text-sm font-semibold text-text-muted whitespace-nowrap flex items-center gap-2">
                  VAT (%) <Settings className="w-4 h-4 text-text-dim" />
                </label>
                <div className="flex items-center gap-3 w-32 justify-end">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.vat_percent}
                    onChange={e => handleChange('vat_percent', parseFloat(e.target.value) || 0)}
                    className="form-input w-16 text-center"
                  />
                  <span className="text-sm font-semibold text-text">
                    {totals.vatAmount.toLocaleString('th-TH')}
                  </span>
                </div>
              </div>

              <div className="flex justify-between w-full max-w-sm text-lg font-bold text-text pt-4 border-t border-white/10">
                <span>ยอดชำระสุทธิ:</span>
                <span className="text-primary-light font-extrabold text-xl font-mono">{totals.grandTotal.toLocaleString('th-TH')} บาท</span>
              </div>
            </div>
          </div>

          {/* Footer Settings Section */}
          <div className="card space-y-8">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="form-label">เงื่อนไขการชำระเงิน (Payment Terms)</label>
                  <div className="mb-4">
                    <SelectField 
                      onChange={val => handleChange('payment_terms_preset', val)}
                      value={formData.payment_terms_preset || ''}
                      options={[
                        { value: '', label: '-- เลือกแบบฟอร์มเงื่อนไขการชำระเงิน --' },
                        ...(presets?.payment_terms || []).map((preset) => ({
                          value: preset,
                          label: preset
                        }))
                      ]}
                    />
                  </div>
                <textarea
                  value={formData.payment_terms_preset}
                  onChange={e => handleChange('payment_terms_preset', e.target.value)}
                  rows={3}
                  className="form-input resize-none"
                />
              </div>
              <div>
                <label className="form-label">หมายเหตุ (Notes)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  rows={3}
                  className="form-input resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
 
      <div className="px-8 py-5 bg-white/[0.02] border-t border-white/10 flex justify-end">
        <button
          onClick={() => onGenerate(formData)}
          className="btn btn-primary px-8 py-3"
        >
          สร้าง Markdown จากฟอร์ม
        </button>
      </div>
    </div>
  );
}
