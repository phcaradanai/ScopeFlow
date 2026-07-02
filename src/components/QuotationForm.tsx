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
    <div className="flex flex-col h-full bg-gradient-to-b from-[#121214] to-[#09090b] overflow-hidden min-w-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10 flex flex-col xl:flex-row gap-8 items-start">
          
          {/* Left Column: Main Form */}
          <div className="flex-1 min-w-0 w-full space-y-8">
            
            {/* Header Section */}
            <div className="card space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold flex items-center gap-3 text-text">
                  <FileText className="w-5 h-5 text-primary" />
                  ข้อมูลทั่วไป
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 min-w-0">
                  <label className="form-label whitespace-normal break-words">ชื่อเอกสาร (Title)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => handleChange('title', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="min-w-0">
                  <label className="form-label whitespace-normal break-words">อ้างอิงขอบเขตงาน (Scope Ref)</label>
                  <input
                    type="text"
                    value={formData.scope_ref}
                    onChange={e => handleChange('scope_ref', e.target.value)}
                    className="form-input"
                    placeholder="เช่น Scope v1.0"
                  />
                </div>
                <div className="min-w-0">
                  <label className="form-label whitespace-normal break-words">ยืนราคาถึงวันที่ (Valid Until)</label>
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
            <div className="card space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-3 text-text">
                    <Calculator className="w-5 h-5 text-accent" />
                    รายการ (Line Items)
                  </h3>
                  <p className="text-xs text-text-dim mt-1 font-medium whitespace-normal break-words">เพิ่มรายการงานและราคาต่อหน่วย</p>
                </div>
                <button
                  onClick={addLineItem}
                  className="btn btn-sm text-primary bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white hover:border-primary shrink-0"
                >
                  <Plus className="w-4 h-4" /> เพิ่มรายการ
                </button>
              </div>

              <div className="space-y-4">
                {/* Table Header for Medium+ Screens */}
                <div className="hidden md:grid md:grid-cols-[40px_minmax(120px,1fr)_80px_80px_100px_120px_40px] gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-dim bg-white/[0.02] rounded-lg">
                  <div className="text-center">#</div>
                  <div>รายละเอียดงาน</div>
                  <div className="text-right">จำนวน</div>
                  <div className="text-center">หน่วย</div>
                  <div className="text-right">ราคา/หน่วย</div>
                  <div className="text-right">รวม (บาท)</div>
                  <div></div>
                </div>

                {formData.line_items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-col md:grid md:grid-cols-[40px_minmax(120px,1fr)_80px_80px_100px_120px_40px] gap-4 md:gap-3 items-start md:items-center bg-white/[0.01] hover:bg-white/[0.03] p-4 md:px-4 md:py-3 rounded-2xl md:rounded-xl border border-white/5 hover:border-white/10 shadow-sm transition-all duration-300 group min-w-0"
                  >
                    {/* Index & Mobile Action Row */}
                    <div className="flex justify-between items-center w-full md:w-auto md:justify-center">
                      <div className="text-sm font-bold text-text-muted">
                        <span className="md:hidden text-text-dim text-xs font-bold mr-2 uppercase">รายการที่</span>
                        {index + 1}
                      </div>
                      <button
                        onClick={() => removeLineItem(item.id)}
                        disabled={formData.line_items.length === 1}
                        className="md:hidden btn btn-icon text-text-dim hover:text-error disabled:opacity-30 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Description */}
                    <div className="w-full min-w-0">
                      <label className="block md:hidden text-xs text-text-dim font-bold mb-1.5 uppercase">รายละเอียดงาน</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                        placeholder="รายละเอียดงาน"
                        className="form-input w-full min-w-0"
                      />
                    </div>

                    {/* Mobile Flex Row for Numbers */}
                    <div className="flex flex-row md:contents gap-4 w-full">
                      {/* Quantity */}
                      <div className="flex-1 md:w-auto min-w-0">
                        <label className="block md:hidden text-xs text-text-dim font-bold mb-1.5 uppercase truncate">จำนวน</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="จำนวน"
                          className="form-input text-right w-full min-w-0"
                        />
                      </div>

                      {/* Unit */}
                      <div className="flex-1 md:w-auto min-w-0">
                        <label className="block md:hidden text-xs text-text-dim font-bold mb-1.5 uppercase truncate">หน่วย</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => handleLineItemChange(item.id, 'unit', e.target.value)}
                          placeholder="หน่วย"
                          className="form-input text-center w-full min-w-0"
                        />
                      </div>
                      
                      {/* Unit Price */}
                      <div className="flex-1 md:w-auto min-w-0">
                        <label className="block md:hidden text-xs text-text-dim font-bold mb-1.5 uppercase truncate">ราคา/หน่วย</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={e => handleLineItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="ราคา/หน่วย"
                          className="form-input text-right w-full min-w-0"
                        />
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="w-full md:w-auto text-right min-w-0 mt-2 md:mt-0 flex justify-between md:block items-center border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                      <label className="block md:hidden text-xs text-text-dim font-bold uppercase truncate">รวม (บาท)</label>
                      <span className="text-base font-bold text-text font-mono truncate">
                        {(item.quantity * item.unit_price).toLocaleString('th-TH')}
                      </span>
                    </div>

                    {/* Desktop Action button */}
                    <div className="hidden md:flex justify-end shrink-0">
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
            </div>
          </div>

          {/* Right Column: Sidebar (Summary & Settings) */}
          <div className="w-full xl:w-[360px] shrink-0 flex flex-col gap-8 min-w-0">
            
            {/* Totals Section */}
            <div className="card space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-3 text-text border-b border-white/10 pb-4">
                สรุปยอดเงิน
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm text-text-muted gap-2">
                  <span className="shrink-0 whitespace-nowrap">รวมเป็นเงิน:</span>
                  <span className="font-semibold text-text truncate font-mono">{totals.subtotal.toLocaleString('th-TH')} บาท</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center gap-2">
                    <label className="text-sm text-text-muted whitespace-nowrap font-medium shrink-0">หักส่วนลด:</label>
                    <SelectField
                      value={formData.discount_type || 'none'}
                      onChange={val => handleChange('discount_type', val)}
                      options={[
                        { value: 'none', label: 'ไม่มี' },
                        { value: 'amount', label: 'จำนวนเงิน' },
                        { value: 'percent', label: 'เปอร์เซ็นต์' },
                      ]}
                      className="w-32 min-w-0"
                    />
                  </div>
                  {(formData.discount_type === 'amount' || formData.discount_type === 'percent') && (
                    <div className="flex justify-end">
                      <input
                        type="number"
                        min="0"
                        max={formData.discount_type === 'percent' ? "100" : undefined}
                        value={formData.discount_value || 0}
                        onChange={e => handleChange('discount_value', parseFloat(e.target.value) || 0)}
                        className="form-input w-32 text-right"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center gap-2">
                  <label className="text-sm font-semibold text-text-muted whitespace-nowrap flex items-center gap-2 shrink-0">
                    VAT (%)
                  </label>
                  <div className="flex items-center gap-3 justify-end min-w-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.vat_percent}
                      onChange={e => handleChange('vat_percent', parseFloat(e.target.value) || 0)}
                      className="form-input w-16 text-center shrink-0"
                    />
                    <span className="text-sm font-semibold text-text truncate font-mono">
                      {totals.vatAmount.toLocaleString('th-TH')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-bold text-text pt-4 border-t border-white/10 gap-2">
                  <span className="shrink-0 whitespace-nowrap">ยอดชำระสุทธิ:</span>
                  <span className="text-primary-light font-extrabold text-xl font-mono truncate">{totals.grandTotal.toLocaleString('th-TH')} บาท</span>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="card space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-3 text-text border-b border-white/10 pb-4">
                <Settings className="w-5 h-5 text-text-dim" />
                ตั้งค่าเพิ่มเติม
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="min-w-0">
                  <label className="form-label whitespace-normal break-words">เงื่อนไขการชำระเงิน</label>
                  <div className="mb-4 min-w-0">
                    <SelectField 
                      onChange={val => handleChange('payment_terms_preset', val)}
                      value={formData.payment_terms_preset || ''}
                      options={[
                        { value: '', label: '-- เลือกแบบฟอร์ม --' },
                        ...(presets?.payment_terms || []).map((preset) => ({
                          value: preset,
                          label: preset
                        }))
                      ]}
                      className="min-w-0 w-full"
                    />
                  </div>
                  <textarea
                    value={formData.payment_terms_preset}
                    onChange={e => handleChange('payment_terms_preset', e.target.value)}
                    rows={5}
                    className="form-input resize-y w-full min-w-0 break-words"
                  />
                </div>
                <div className="min-w-0">
                  <label className="form-label whitespace-normal break-words">หมายเหตุ (Notes)</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => handleChange('notes', e.target.value)}
                    rows={3}
                    className="form-input resize-y w-full min-w-0 break-words"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
 
      {/* Footer Action Area */}
      <div className="px-4 sm:px-8 py-4 bg-white/[0.02] border-t border-white/10 flex justify-end shrink-0 w-full">
        <button
          onClick={() => onGenerate(formData)}
          className="btn btn-primary px-8 py-3 w-full sm:w-auto"
        >
          สร้างเอกสารจากฟอร์ม
        </button>
      </div>
    </div>
  );
}
