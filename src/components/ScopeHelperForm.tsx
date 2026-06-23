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
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        <div className="bg-surface-2 border border-border p-4 rounded-xl space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            ผู้ช่วยสร้างเอกสารขอบเขตงาน (Scope Helper)
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">ชื่อเอกสาร (Title)</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">ความเป็นมาและวัตถุประสงค์ (Project Overview)</label>
              <textarea
                value={formData.project_overview}
                onChange={e => handleChange('project_overview', e.target.value)}
                rows={3}
                placeholder="อธิบายสั้นๆ ว่าโครงการนี้ทำเพื่ออะไร..."
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">ขอบเขตที่รวมอยู่ในโครงการ (In-Scope)</label>
              <textarea
                value={formData.included_items}
                onChange={e => handleChange('included_items', e.target.value)}
                rows={4}
                placeholder="- รายการที่ 1\n- รายการที่ 2"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">สิ่งที่อยู่นอกเหนือขอบเขต (Out-of-Scope)</label>
              <textarea
                value={formData.excluded_items}
                onChange={e => handleChange('excluded_items', e.target.value)}
                rows={3}
                placeholder="- งานที่ไม่ได้รวมอยู่ในราคานี้"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">สิ่งที่ต้องส่งมอบ (Deliverables)</label>
              <textarea
                value={formData.deliverables}
                onChange={e => handleChange('deliverables', e.target.value)}
                rows={3}
                placeholder="- Source Code\n- คู่มือการใช้งาน"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">เกณฑ์การตรวจรับ (Acceptance Criteria)</label>
              <textarea
                value={formData.acceptance_criteria}
                onChange={e => handleChange('acceptance_criteria', e.target.value)}
                rows={3}
                placeholder="ระบุเงื่อนไขที่ใช้ในการตรวจรับงาน"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">ข้อตกลงและเงื่อนไขเพิ่มเติม (Assumptions)</label>
              <textarea
                value={formData.assumptions}
                onChange={e => handleChange('assumptions', e.target.value)}
                rows={3}
                placeholder="เช่น ลูกค้าต้องเตรียมข้อมูลให้ครบถ้วนก่อนเริ่มงาน"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary resize-y"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-surface-2 border-t border-border flex justify-end">
        <button
          onClick={() => onGenerate(formData)}
          className="px-6 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary-hover text-white transition-colors"
        >
          สร้าง Markdown จากแบบฟอร์ม
        </button>
      </div>
    </div>
  );
}
