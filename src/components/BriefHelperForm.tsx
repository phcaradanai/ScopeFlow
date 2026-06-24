import { useState } from 'react';
import { BriefFormData, projectPresets } from '../lib/brief-builder';
import SelectField from './ui/SelectField';

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
  const [error, setError] = useState('');
  const handleChange = (field: keyof BriefFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const projectTypes = Object.keys(projectPresets);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.raw_request.trim()) {
      setError('กรุณาใส่ข้อความ/คำพูดจากลูกค้า');
      return;
    }

    try {
      onGenerate(formData);
      // onClose();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#121214] to-[#09090b] overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[920px] mx-auto px-8 py-10 flex flex-col gap-8">
          
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-text">เริ่มจากคำขอลูกค้า</h2>
              <p className="text-sm text-text-dim mt-1">ใส่ข้อมูลที่มีมาก่อน เดี๋ยวระบบช่วยจัดกรอบงานและบอกว่าต้องถามอะไรต่อ</p>
            </div>
          </div>

          <form id="brief-helper-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
                {error}
              </div>
            )}

            <div className="card">
              <label className="form-label font-bold text-base mb-3 block">วางข้อความ/คำพูดจากลูกค้าที่นี่</label>
              <textarea
                value={formData.raw_request}
                onChange={e => handleChange('raw_request', e.target.value)}
                placeholder="วางข้อความแชท อีเมล หรือโน้ตประชุมที่นี่..."
                className="form-textarea"
                style={{ minHeight: '200px' }}
              />
            </div>

            <div className="card">
              <label className="form-label font-bold text-base mb-3 block">ประเภทโครงการ</label>
              <SelectField
                value={formData.project_type}
                onChange={val => handleChange('project_type', val)}
                options={projectTypes.map(pt => ({ value: pt, label: pt }))}
              />
            </div>
          </form>

          {/* Bottom action bar */}
          <div className="flex items-center justify-end pt-4 border-t border-border mt-auto">
            <button
              type="submit" form="brief-helper-form"
              disabled={!formData.raw_request.trim()}
              className="btn btn-primary px-8"
              style={{ minHeight: '48px' }}
            >
              สร้าง Markdown
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
