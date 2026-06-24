import { useState } from 'react';
import { useWorkspace } from '../lib/workspace-context';
import { createDocument, pathExists, createProject } from '../lib/tauri-commands';
import { generateBriefDocument, BriefFormData, projectPresets } from '../lib/brief-builder';
import { X, AlertTriangle, FileText } from 'lucide-react';
import SelectField from './ui/SelectField';

interface BriefIntakeModalProps {
  clientId: string;
  projectId?: string;
  projectPath?: string;
  onClose: () => void;
}

const defaultData: BriefFormData = {
  raw_request: '',
  project_type: 'อื่น ๆ',
};

export default function BriefIntakeModal({
  clientId,
  projectId,
  projectPath,
  onClose,
}: BriefIntakeModalProps) {
  const { workspacePath, refreshTree, setSelectedFile } = useWorkspace();
  const [formData, setFormData] = useState<BriefFormData>(defaultData);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Conflict resolution state
  const [conflictPath, setConflictPath] = useState<string | null>(null);
  const [conflictProjectPath, setConflictProjectPath] = useState<string | null>(null);
  const [conflictProjectId, setConflictProjectId] = useState<string | null>(null);

  const projectTypes = Object.keys(projectPresets);

  const handleChange = (field: keyof BriefFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenExisting = () => {
    if (conflictPath) {
      setSelectedFile(conflictPath);
      onClose();
    }
  };

  const handleCreateNewVersion = async () => {
    if (!conflictProjectPath || !conflictProjectId) return;
    
    try {
      setSaving(true);
      setError('');
      
      const briefDocData = {
        ...formData,
        project: conflictProjectId,
        client: clientId,
        projectName: `โครงการใหม่ (${formData.project_type || 'ร่างความต้องการ'})`
      };
      const finalContent = generateBriefDocument(briefDocData);
      
      // Calculate next version
      const timestamp = Date.now();
      const filename = `brief-v1.1-${timestamp}.md`; // safe fallback versioning
      const finalPath = `${conflictProjectPath}/baseline/${filename}`;
      
      await createDocument(finalPath, finalContent);
      await refreshTree();
      setSelectedFile(finalPath);
      onClose();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.raw_request.trim()) {
      setError('กรุณาใส่ข้อความ/คำพูดจากลูกค้า');
      return;
    }

    try {
      setSaving(true);
      
      let finalProjectId = projectId;
      let finalProjectPath = projectPath;

      if (!finalProjectId || !finalProjectPath) {
        if (!workspacePath) {
          setError('ไม่พบ workspace path');
          setSaving(false);
          return;
        }
        
        // Create new project automatically
        const timestamp = Date.now();
        const generatedProjId = `project-${timestamp}`;
        const projName = `โครงการใหม่ (${formData.project_type || 'ร่างความต้องการ'})`;
        
        const { generateProjectYaml } = await import('../lib/templates');
        const projYaml = generateProjectYaml({
          id: generatedProjId,
          name: projName,
          client: clientId,
          type: 'new-project',
        });

        await createProject(workspacePath, clientId, generatedProjId, projYaml, 'new-project');
        finalProjectId = generatedProjId;
        finalProjectPath = `${workspacePath}/clients/${clientId}/projects/${generatedProjId}`;
      }

      const filename = 'brief-v1.0.md';
      const finalPath = `${finalProjectPath}/baseline/${filename}`;
      
      const exists = await pathExists(finalPath);
      if (exists) {
        setConflictPath(finalPath);
        setConflictProjectPath(finalProjectPath);
        setConflictProjectId(finalProjectId);
        setSaving(false);
        return; // Stop and show conflict UI
      }

      const briefDocData = {
        ...formData,
        project: finalProjectId,
        client: clientId,
        projectName: `โครงการใหม่ (${formData.project_type || 'ร่างความต้องการ'})`
      };
      
      const finalContent = generateBriefDocument(briefDocData);

      await createDocument(finalPath, finalContent);
      await refreshTree();

      // Open the newly created document
      setSelectedFile(finalPath);
      onClose();
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  if (conflictPath) {
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <div className="modal-header-content">
              <h2 className="modal-title flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                พบไฟล์ Brief เดิมอยู่แล้ว
              </h2>
              <p className="modal-subtitle">เอกสาร <span className="font-mono text-text">brief-v1.0.md</span> ถูกสร้างไว้แล้วในโครงการนี้</p>
            </div>
            <button onClick={onClose} className="modal-close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="modal-body">
            <div className="p-4 rounded-xl bg-surface-2 border border-border flex flex-col gap-4 items-center text-center">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text mb-1">คุณต้องการทำอะไร?</h3>
                <p className="text-sm text-text-dim">คุณสามารถเปิดไฟล์เดิมขึ้นมาแก้ไข หรือสร้างเวอร์ชันใหม่ (v1.1) ได้</p>
              </div>
            </div>
          </div>

          <div className="modal-footer flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => setConflictPath(null)} className="btn btn-ghost w-full sm:w-auto">
              ย้อนกลับ
            </button>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCreateNewVersion}
                disabled={saving}
                className="btn btn-outline flex-1 sm:flex-none"
              >
                {saving ? 'กำลังสร้าง...' : 'สร้างเวอร์ชันใหม่'}
              </button>
              <button
                type="button"
                onClick={handleOpenExisting}
                className="btn btn-primary flex-1 sm:flex-none"
              >
                เปิด Brief เดิม
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        <form id="brief-intake-form" onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div className="form-section">
            <label className="form-label">วางข้อความ/คำพูดจากลูกค้าที่นี่</label>
            <textarea
              value={formData.raw_request}
              onChange={(e) => handleChange('raw_request', e.target.value)}
              placeholder="วางข้อความแชท อีเมล หรือโน้ตประชุมที่นี่..."
              className="form-textarea"
              style={{ minHeight: '140px' }}
              autoFocus
            />
          </div>

          <div className="form-section mt-5">
            <label className="form-label">ประเภทโครงการ (เลือกเพื่อให้ระบบแนะนำได้แม่นยำขึ้น)</label>
            <SelectField
              value={formData.project_type}
              onChange={(val) => handleChange('project_type', val)}
              options={projectTypes.map((pt) => ({ value: pt, label: pt }))}
            />
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            ยกเลิก
          </button>
          <button
            type="submit"
            form="brief-intake-form"
            disabled={!formData.raw_request.trim() || saving}
            className="btn btn-primary px-8"
            style={{ minHeight: '48px' }}
          >
            {saving ? 'กำลังสร้าง...' : 'สร้างร่าง Brief'}
          </button>
        </div>
      </div>
    </div>
  );
}
