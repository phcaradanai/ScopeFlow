import { useState } from 'react';
import { FileText } from 'lucide-react';
import { BriefFormData, projectPresets } from '../lib/brief-builder';

interface BriefHelperFormProps {
  initialData?: BriefFormData | null;
  onGenerate: (data: BriefFormData) => void;
}

const defaultData: BriefFormData = {
  raw_request: '',
  project_type: 'อื่น ๆ',
};

export default function BriefHelperForm({ initialData, onGenerate }: BriefHelperFormProps) {
  const [formData, setFormData] = useState<BriefFormData>(initialData || defaultData);

  const handleChange = (field: keyof BriefFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const projectTypes = Object.keys(projectPresets);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#121214] to-[#09090b] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[920px] mx-auto px-8 py-10 flex flex-col gap-8">
          
          <div className="card">
            <div className="flex items-start gap-3 mb-5">
              <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-text">เริ่มจากคำขอลูกค้า</h3>
                <p className="text-sm text-text-dim mt-1">ใส่ข้อมูลที่มีมาก่อน เดี๋ยวระบบช่วยจัดกรอบงานและบอกว่าต้องถามอะไรต่อ</p>
              </div>
            </div>
            
            <div className="form-section">
              <label className="form-label">วางข้อความ/คำพูดจากลูกค้าที่นี่</label>
              <textarea
                value={formData.raw_request}
                onChange={e => handleChange('raw_request', e.target.value)}
                placeholder="วางข้อความแชท อีเมล หรือโน้ตประชุมที่นี่..."
                className="form-textarea"
                style={{ minHeight: '140px' }}
              />
            </div>

            <div className="form-section mt-5">
              <label className="form-label">ประเภทโครงการ (เลือกเพื่อให้ระบบแนะนำได้แม่นยำขึ้น)</label>
              <select
                value={formData.project_type}
                onChange={e => handleChange('project_type', e.target.value)}
                className="form-select"
                style={{ height: '48px' }}
              >
                {projectTypes.map(pt => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-sm text-text-dim">
              สร้างร่าง Brief ทันที ไม่ต้องกรอกฟอร์มยาวๆ
            </span>
            <button
              type="button"
              onClick={() => onGenerate(formData)}
              disabled={!formData.raw_request.trim()}
              className="btn btn-primary px-8"
              style={{ minHeight: '48px' }}
            >
              สร้างร่าง Brief
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
