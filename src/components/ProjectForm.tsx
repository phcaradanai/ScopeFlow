import { useState } from 'react';
import { useWorkspace } from '../lib/workspace-context';
import { createProject } from '../lib/tauri-commands';
import {
  generateProjectYaml,
  generateCurrentSystemOverview,
  generateCurrentSystemModules,
  generateCurrentSystemPages,
  generateCurrentSystemRoles,
  generateCurrentSystemIntegrations,
  generateCurrentSystemLimitations,
} from '../lib/templates';
import { validateProjectData, validateSlug, nameToSlug } from '../lib/validation';
import { X } from 'lucide-react';

interface ProjectFormProps {
  clientId: string;
  onClose: () => void;
}

export default function ProjectForm({ clientId, onClose }: ProjectFormProps) {
  const { workspacePath, refreshTree } = useWorkspace();
  const [name, setName] = useState('');
  const [type, setType] = useState('new-project');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [customId, setCustomId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const generatedId = nameToSlug(name || customId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validation = validateProjectData({ name, type });
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    const projectId = customId || generatedId;
    const slugValidation = validateSlug(projectId);
    if (!slugValidation.valid) {
      setError(slugValidation.error || 'รหัสโครงการไม่ถูกต้อง');
      return;
    }

    if (!workspacePath) {
      setError('ไม่พบ workspace');
      return;
    }

    setSaving(true);
    try {
      const yaml = generateProjectYaml({
        id: projectId,
        name,
        client: clientId,
        type,
        start_date: startDate || undefined,
        target_date: targetDate || undefined,
        notes: notes || undefined,
      });

      // Prepare current-system files for maintenance/support projects
      let currentSystemFiles: [string, string][] | undefined;
      if (type === 'maintenance' || type === 'support-contract') {
        currentSystemFiles = [
          ['overview.md', generateCurrentSystemOverview()],
          ['modules.yaml', generateCurrentSystemModules()],
          ['pages.yaml', generateCurrentSystemPages()],
          ['roles.yaml', generateCurrentSystemRoles()],
          ['integrations.yaml', generateCurrentSystemIntegrations()],
          ['known-limitations.md', generateCurrentSystemLimitations()],
        ];
      }

      await createProject(workspacePath, clientId, projectId, yaml, type, currentSystemFiles);
      await refreshTree();
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">เริ่มสร้างงานให้ลูกค้า</h2>
            <p className="modal-subtitle">สร้างโครงการใหม่สำหรับ <span className="font-semibold text-text">{clientId}</span></p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="project-form" onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section-title">ข้อมูลงาน</h3>
            <p className="form-section-helper">ตั้งชื่อและเลือกประเภทโครงการ</p>
            
            <div className="form-field">
              <label className="form-label">
                ชื่อโครงการ <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Website Redesign 2025"
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-field">
              <label className="form-label">รหัสโครงการ (ID)</label>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder={generatedId || 'auto-generated'}
                className="form-input font-mono"
              />
              <p className="form-helper">
                ใช้เป็นชื่อโฟลเดอร์ → <span className="font-mono text-text-muted">{customId || generatedId || '...'}</span>
              </p>
            </div>

            <div className="form-field">
              <label className="form-label">
                ประเภทโครงการ <span className="text-error">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="form-select"
              >
                <option value="new-project">โครงการใหม่</option>
                <option value="maintenance">ดูแลระบบ (MA)</option>
                <option value="support-contract">สัญญาซัพพอร์ต</option>
              </select>
              {(type === 'maintenance' || type === 'support-contract') && (
                <p className="form-helper text-primary-light">
                  📁 จะสร้างโฟลเดอร์ current-system/ สำหรับบันทึกข้อมูลระบบปัจจุบัน
                </p>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">ระยะเวลา</h3>
            <p className="form-section-helper">กำหนดวันเริ่มต้นและวันที่คาดว่าจะเสร็จ</p>
            
            <div className="form-field-row">
              <div className="form-field">
                <label className="form-label">วันเริ่มต้น</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">วันที่คาดว่าจะเสร็จ</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">คำขอเริ่มต้นจากลูกค้า</h3>
            <p className="form-section-helper">บันทึกข้อความเริ่มต้นจากลูกค้าไว้ที่นี่</p>
            
            <div className="form-field">
              <label className="form-label">บันทึกข้อความ</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="วางข้อความอธิบายจากลูกค้า, รายการที่ต้องการ, ข้อจำกัด, หรือเงื่อนไขพิเศษ..."
                className="form-textarea"
              />
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            ยกเลิก
          </button>
          <button type="submit" form="project-form" disabled={saving} className="btn btn-primary">
            {saving ? 'กำลังบันทึก...' : 'สร้างโครงการ'}
          </button>
        </div>
      </div>
    </div>
  );
}
