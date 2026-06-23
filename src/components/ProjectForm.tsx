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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">สร้างโครงการใหม่</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-3 text-text-dim hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="px-3 py-2 rounded-lg bg-surface-3/50 text-sm text-text-muted">
            ลูกค้า: <span className="font-medium text-text">{clientId}</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              ชื่อโครงการ <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Website Redesign 2025"
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              รหัสโครงการ (ID)
            </label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder={generatedId || 'auto-generated'}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              ประเภทโครงการ <span className="text-error">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            >
              <option value="new-project">โครงการใหม่</option>
              <option value="maintenance">ดูแลระบบ (MA)</option>
              <option value="support-contract">สัญญาซัพพอร์ต</option>
            </select>
            {(type === 'maintenance' || type === 'support-contract') && (
              <p className="text-xs text-primary-light mt-1">
                📁 จะสร้างโฟลเดอร์ current-system/ สำหรับบันทึกข้อมูลระบบปัจจุบัน
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">วันเริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                วันที่คาดว่าจะเสร็จ
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">หมายเหตุ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'สร้างโครงการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
