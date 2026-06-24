import { useState } from 'react';
import { BriefFormData, projectPresets } from '../lib/brief-builder';
import SelectField from './ui/SelectField';
import { X } from 'lucide-react';

interface BriefHelperFormProps {
  initialData?: BriefFormData | null;
  onGenerate: (data: BriefFormData) => void;
  clientId: string;
  onClose: () => void;
}

const defaultData: BriefFormData = {
  raw_request: '',
  project_type: 'อื่น ๆ',
};

export default function BriefHelperForm({ initialData, onGenerate, clientId, onClose }: BriefHelperFormProps) {
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
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">เริ่มจากคำขอลูกค้า</h2>
            <p className="modal-subtitle">ใส่ข้อมูลที่มีมาก่อน เดี๋ยวระบบช่วยจัดกรอบงานและบอกว่าต้องถามอะไรต่อ <span className="font-semibold text-text">{clientId}</span></p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="brief-helper-form" onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}


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
            <SelectField
              value={formData.project_type}
              onChange={val => handleChange('project_type', val)}
              options={projectTypes.map(pt => ({ value: pt, label: pt }))}
            />
          </div>
        </form>

        {/* Bottom action bar */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            ยกเลิก
          </button>
          <button
            type="submit" form="brief-helper-form"
            disabled={!formData.raw_request.trim()}
            className="btn btn-primary px-8"
            style={{ minHeight: '48px' }}
          >
            สร้างร่าง Brief
          </button>
        </div>

      </div>
    </div >
  );
}
