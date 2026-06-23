import { useState } from 'react';
import { useWorkspace } from '../lib/workspace-context';
import { createClient } from '../lib/tauri-commands';
import { generateClientYaml } from '../lib/templates';
import { validateClientData, validateSlug, nameToSlug } from '../lib/validation';
import { X } from 'lucide-react';

interface ClientFormProps {
  onClose: () => void;
}

export default function ClientForm({ onClose }: ClientFormProps) {
  const { workspacePath, refreshTree } = useWorkspace();
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [customId, setCustomId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const generatedId = nameToSlug(name || customId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validation = validateClientData({ name, contact_person: contactPerson });
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    const clientId = customId || generatedId;
    const slugValidation = validateSlug(clientId);
    if (!slugValidation.valid) {
      setError(slugValidation.error || 'รหัสลูกค้าไม่ถูกต้อง');
      return;
    }

    if (!workspacePath) {
      setError('ไม่พบ workspace');
      return;
    }

    setSaving(true);
    try {
      const yaml = generateClientYaml({
        id: clientId,
        name,
        contact_person: contactPerson,
        email,
        phone,
        line_id: lineId,
        address,
        tax_id: taxId,
        notes,
      });

      await createClient(workspacePath, clientId, yaml);
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
          <h2 className="text-lg font-semibold">สร้างลูกค้าใหม่</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-3 text-text-dim hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              ชื่อลูกค้า / บริษัท <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น บริษัท ABC จำกัด"
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              รหัสลูกค้า (ID)
            </label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder={generatedId || 'auto-generated'}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors font-mono text-sm"
            />
            <p className="text-xs text-text-dim mt-1">
              ใช้เป็นชื่อโฟลเดอร์ (ตัวพิมพ์เล็ก, ขีดกลาง) → {customId || generatedId || '...'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              ชื่อผู้ติดต่อ <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="เช่น คุณสมหญิง"
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">เบอร์โทร</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">LINE ID</label>
            <input
              type="text"
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">ที่อยู่</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              เลขผู้เสียภาษี
            </label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
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
              {saving ? 'กำลังบันทึก...' : 'สร้างลูกค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
