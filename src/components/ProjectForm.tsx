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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-text">สร้างโครงการใหม่</h2>
          <button
            onClick={onClose}
            className="btn btn-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-section">
          <div className="px-4 py-3 rounded-xl bg-surface-3/50 text-sm text-text-muted font-medium">
            ลูกค้า: <span className="font-semibold text-text">{clientId}</span>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div>
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

          <div>
            <label className="form-label">รหัสโครงการ (ID)</label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder={generatedId || 'auto-generated'}
              className="form-input font-mono"
            />
          </div>

          <div>
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
              <p className="text-xs text-primary-light mt-1.5 px-1">
                📁 จะสร้างโฟลเดอร์ current-system/ สำหรับบันทึกข้อมูลระบบปัจจุบัน
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">วันเริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">วันที่คาดว่าจะเสร็จ</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">หมายเหตุ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="form-input resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'กำลังบันทึก...' : 'สร้างโครงการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
