import { useState } from 'react';
import { FileText, AlertTriangle, HelpCircle } from 'lucide-react';
import { ScopeFormData } from '../lib/scope-builder';

interface ScopeHelperFormProps {
  initialData?: ScopeFormData | null;
  onGenerate: (data: ScopeFormData) => void;
}

const defaultData: ScopeFormData = {
  title: 'ขอบเขตงาน (Scope of Work)',
  project_overview: '',
  included_items: '',
  excluded_items: '',
  deliverables: '',
  acceptance_criteria: '',
  assumptions: ''
};

export default function ScopeHelperForm({ initialData, onGenerate }: ScopeHelperFormProps) {
  const [formData, setFormData] = useState<ScopeFormData>(initialData || defaultData);

  const handleChange = (field: keyof ScopeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasOutOfScope = formData.excluded_items.trim().length > 0;
  const hasAcceptance = formData.acceptance_criteria.trim().length > 0;
  const hasDeliverables = formData.deliverables.trim().length > 0;
  const hasAssumptions = formData.assumptions.trim().length > 0;
  const missingCount = [!hasOutOfScope, !hasAcceptance, !hasDeliverables, !hasAssumptions].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#121214] to-[#09090b] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[920px] mx-auto px-8 py-10 flex flex-col gap-8">

          {/* STEP 1: Raw request */}
          <div className="card">
            <div className="flex items-start gap-3 mb-5">
              <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-text">Step 1: วางคำขอลูกค้าที่นี่</h3>
                <p className="text-sm text-text-dim mt-1">บรรทัดเดียวหรือยาว ๆ ก็ได้ — ระบบจะช่วยจัดให้</p>
              </div>
            </div>
            <textarea
              value={formData.project_overview}
              onChange={e => handleChange('project_overview', e.target.value)}
              rows={5}
              placeholder="เช่น ลูกค้าต้องการเว็บไซต์สำเร็จรูป ใช้ขายสินค้าออนไลน์ รองรับภาษาไทย/อังกฤษ ต้องเชื่อมต่อกับ Kerry Express..."
              className="form-textarea"
              style={{ minHeight: '160px' }}
            />
          </div>

          {/* STEP 2: Details */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-text">Step 2: เติมรายละเอียดเพิ่มเติม (ถ้ามี)</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="form-section">
                <label className="form-label">เป้าหมาย (Goal)</label>
                <textarea
                  value={formData.project_overview}
                  onChange={e => handleChange('project_overview', e.target.value)}
                  rows={3}
                  placeholder="วัตถุประสงค์หลักของโครงการนี้..."
                  className="form-textarea"
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div className="form-section">
                <label className="form-label">สิ่งที่รวมอยู่ในขอบเขต (In-Scope)</label>
                <textarea
                  value={formData.included_items}
                  onChange={e => handleChange('included_items', e.target.value)}
                  rows={3}
                  placeholder="- สิ่งที่เราจะทำในโครงการนี้"
                  className="form-textarea"
                  style={{ minHeight: '120px' }}
                />
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">สิ่งที่อยู่นอกเหนือขอบเขต (Out-of-Scope)</label>
              <textarea
                value={formData.excluded_items}
                onChange={e => handleChange('excluded_items', e.target.value)}
                rows={2}
                placeholder="- สิ่งที่ไม่รวมอยู่ในราคา/โครงการนี้ เช่น การฝึกอบรมลูกค้า การเดินทางเพื่อติดตั้ง"
                className="form-textarea"
                style={{ minHeight: '100px' }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="form-section">
                <label className="form-label">สิ่งที่ต้องส่งมอบ (Deliverables)</label>
                <textarea
                  value={formData.deliverables}
                  onChange={e => handleChange('deliverables', e.target.value)}
                  rows={3}
                  placeholder="- Source Code\n- คู่มือการใช้งาน\n- ไฟล์ออกแบบ UX/UI"
                  className="form-textarea"
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div className="form-section">
                <label className="form-label">เกณฑ์การตรวจรับ (Acceptance Criteria)</label>
                <textarea
                  value={formData.acceptance_criteria}
                  onChange={e => handleChange('acceptance_criteria', e.target.value)}
                  rows={3}
                  placeholder="เงื่อนไขที่ลูกค้าต้องยืนยันก่อนรับมอบ..."
                  className="form-textarea"
                  style={{ minHeight: '120px' }}
                />
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">ข้อตกลงและเงื่อนไขเพิ่มเติม (Assumptions)</label>
              <textarea
                value={formData.assumptions}
                onChange={e => handleChange('assumptions', e.target.value)}
                rows={2}
                placeholder="เช่น ลูกค้าต้องเตรียมข้อมูลให้ครบถ้วนก่อนเริ่มงาน..."
                className="form-textarea"
                style={{ minHeight: '100px' }}
              />
            </div>
          </div>

          {/* STEP 3: Risk warnings */}
          {missingCount > 0 && (
            <div className="card border-warning/30">
              <div className="flex items-start gap-3 mb-5">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-warning" />
                <div>
                  <h3 className="text-base font-bold text-text">ตรวจความเสี่ยงงานงอก</h3>
                  <p className="text-sm text-text-dim mt-1">
                    ยังขาดข้อมูล {missingCount} รายการ — ไม่เป็น blocker แต่ควรเติมให้ครบเพื่อป้องกัน Scope  creep
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {!hasOutOfScope && (
                  <div className="warning-banner">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">ขาด out-of-scope</span> — ไม่ระบุชัดเจนว่าสิ่งใดที่ไม่ได้รวมอยู่
                    </div>
                  </div>
                )}
                {!hasAcceptance && (
                  <div className="warning-banner">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">ขาด acceptance criteria</span> — ไม่มีเกณฑ์ที่ชัดเจน
                      ลูกค้าอาจบอกว่าไม่ตรงกับขอ
                    </div>
                  </div>
                )}
                {!hasDeliverables && (
                  <div className="warning-banner">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">ขาด deliverables</span> — ไม่รู้ว่าต้องส่งอะไรให้ลูกค้า
                    </div>
                  </div>
                )}
                {!hasAssumptions && (
                  <div className="warning-banner">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">ขาด assumptions</span> — เงื่อนไขที่ทั้งสองฝ่าย
                      ควรระบุไว้
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom action bar */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-sm text-text-dim">
              สร้าง Draft ได้ทันที
            </span>
            <button
              type="button"
              onClick={() => onGenerate(formData)}
              className="btn btn-primary px-8"
            >
              สร้างเอกสาร
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
