import { useState } from 'react';
import { FileText } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#121214] to-[#09090b] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10 space-y-10">
          <div className="card space-y-8">
            <div className="border-b border-white/10 pb-5">
              <h3 className="text-lg font-bold flex items-center gap-3 text-text">
                <FileText className="w-5 h-5 text-primary" />
                ผู้ช่วยสร้างเอกสารขอบเขตงาน
              </h3>
              <p className="text-sm text-text-dim mt-2 font-medium">กรอกข้อมูลด้านล่างเพื่อสร้างเอกสารขอบเขตงานอัตโนมัติ</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="form-label">ชื่อเอกสาร (Title)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  className="form-input"
                  placeholder="ขอบเขตงาน (Scope of Work)"
                />
              </div>

              <div>
                <label className="form-label">ความเป็นมาและวัตถุประสงค์ (Project Overview)</label>
                <textarea
                  value={formData.project_overview}
                  onChange={e => handleChange('project_overview', e.target.value)}
                  rows={3}
                  placeholder="อธิบายสั้นๆ ว่าโครงการนี้ทำเพื่ออะไร..."
                  className="form-input resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="form-label">ขอบเขตที่รวมอยู่ในโครงการ (In-Scope)</label>
                <textarea
                  value={formData.included_items}
                  onChange={e => handleChange('included_items', e.target.value)}
                  rows={4}
                  placeholder="- รายการที่ 1\n- รายการที่ 2"
                  className="form-input resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="form-label">สิ่งที่อยู่นอกเหนือขอบเขต (Out-of-Scope)</label>
                <textarea
                  value={formData.excluded_items}
                  onChange={e => handleChange('excluded_items', e.target.value)}
                  rows={3}
                  placeholder="- งานที่ไม่ได้รวมอยู่ในราคานี้"
                  className="form-input resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="form-label">สิ่งที่ต้องส่งมอบ (Deliverables)</label>
                <textarea
                  value={formData.deliverables}
                  onChange={e => handleChange('deliverables', e.target.value)}
                  rows={3}
                  placeholder="- Source Code\n- คู่มือการใช้งาน"
                  className="form-input resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="form-label">เกณฑ์การตรวจรับ (Acceptance Criteria)</label>
                <textarea
                  value={formData.acceptance_criteria}
                  onChange={e => handleChange('acceptance_criteria', e.target.value)}
                  rows={3}
                  placeholder="ระบุเงื่อนไขที่ใช้ในการตรวจรับงาน"
                  className="form-input resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="form-label">ข้อตกลงและเงื่อนไขเพิ่มเติม (Assumptions)</label>
                <textarea
                  value={formData.assumptions}
                  onChange={e => handleChange('assumptions', e.target.value)}
                  rows={3}
                  placeholder="เช่น ลูกค้าต้องเตรียมข้อมูลให้ครบถ้วนก่อนเริ่มงาน"
                  className="form-input resize-y leading-relaxed"
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
          สร้าง Markdown จากแบบฟอร์ม
        </button>
      </div>
    </div>
  );
}
