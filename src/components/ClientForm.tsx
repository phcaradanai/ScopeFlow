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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-text">สร้างลูกค้าใหม่</h2>
          <button
            onClick={onClose}
            className="btn btn-icon"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-section">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="form-label">
              ชื่อลูกค้า / บริษัท <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น บริษัท ABC จำกัด"
              className="form-input"
              autoFocus
            />
          </div>

          <div>
            <label className="form-label">รหัสลูกค้า (ID)</label>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder={generatedId || 'auto-generated'}
              className="form-input font-mono"
            />
            <p className="text-xs text-text-dim mt-1.5 px-1">
              ใช้เป็นชื่อโฟลเดอร์ (ตัวพิมพ์เล็ก, ขีดกลาง) → {customId || generatedId || '...'}
            </p>
          </div>

          <div>
            <label className="form-label">
              ชื่อผู้ติดต่อ <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="เช่น คุณสมหญิง"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">เบอร์โทร</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">LINE ID</label>
            <input
              type="text"
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">ที่อยู่</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="form-input resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="form-label">เลขผู้เสียภาษี</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="form-input"
            />
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
              {saving ? 'กำลังบันทึก...' : 'สร้างลูกค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
