import { useState, useEffect } from 'react';
import { X, Building2, Save } from 'lucide-react';
import { CompanyProfile, getCompanyProfile, saveCompanyProfile } from '../lib/settings';

interface CompanySettingsModalProps {
  workspacePath: string;
  onClose: () => void;
}

export default function CompanySettingsModal({ workspacePath, onClose }: CompanySettingsModalProps) {
  const [profile, setProfile] = useState<CompanyProfile>({
    provider_name: '',
    provider_type: 'company',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    website: '',
    line_id: '',
    default_currency: 'THB',
    default_vat_percent: 7,
    default_payment_terms: '',
    default_warranty_terms: '',
    default_support_terms: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompanyProfile(workspacePath);
        if (data) {
          setProfile(prev => ({ ...prev, ...data }));
        }
      } catch (err: any) {
        if (err.message === 'MALFORMED_YAML') {
          setError('ไฟล์ตั้งค่าบริษัท (company-profile.yaml) เสียหายหรือไม่ถูกต้อง คุณสามารถกรอกข้อมูลและบันทึกใหม่เพื่อเขียนทับได้');
        } else {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspacePath]);

  const handleChange = (field: keyof CompanyProfile, value: string | number) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.provider_name.trim()) {
      setError('กรุณาระบุชื่อผู้ให้บริการ (Provider Name)');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await saveCompanyProfile(workspacePath, profile);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface-2 p-6 rounded-2xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-muted">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-primary" />
            ข้อมูลผู้ให้บริการ (Company Settings)
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-surface-3 text-text-dim hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-8 space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <h3 className="font-semibold text-text border-b border-border pb-3">ข้อมูลทั่วไป</h3>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-text-muted mb-2">
                  ชื่อบริษัท / ผู้ให้บริการ <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={profile.provider_name}
                  onChange={e => handleChange('provider_name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="เช่น บริษัท สโคปโฟลว์ จำกัด"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-text-muted mb-2">ประเภท</label>
                <select
                  value={profile.provider_type}
                  onChange={e => handleChange('provider_type', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none cursor-pointer"
                >
                  <option value="company">บริษัท (Company)</option>
                  <option value="agency">เอเจนซี่ (Agency)</option>
                  <option value="freelancer">ฟรีแลนซ์ (Freelancer)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-text-muted mb-2">ที่อยู่ (Address)</label>
                <textarea
                  value={profile.address || ''}
                  onChange={e => handleChange('address', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                  placeholder="ที่อยู่สำหรับออกเอกสาร"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-text-muted mb-2">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                <input
                  type="text"
                  value={profile.tax_id || ''}
                  onChange={e => handleChange('tax_id', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="font-semibold text-text border-b border-border pb-3">ข้อมูลติดต่อ</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-text-muted mb-2">ชื่อผู้ติดต่อ (Contact Name)</label>
                <input
                  type="text"
                  value={profile.contact_name || ''}
                  onChange={e => handleChange('contact_name', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-text-muted mb-2">เบอร์โทรศัพท์ (Phone)</label>
                <input
                  type="text"
                  value={profile.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-text-muted mb-2">อีเมล (Email)</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-text-muted mb-2">เว็บไซต์ (Website)</label>
                <input
                  type="text"
                  value={profile.website || ''}
                  onChange={e => handleChange('website', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="font-semibold text-text border-b border-border pb-3">ค่าเริ่มต้นเอกสาร (Defaults)</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-text-muted mb-2">สกุลเงินเริ่มต้น (Currency)</label>
                <input
                  type="text"
                  value={profile.default_currency || 'THB'}
                  onChange={e => handleChange('default_currency', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-text-muted mb-2">VAT เริ่มต้น (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.default_vat_percent ?? 7}
                  onChange={e => handleChange('default_vat_percent', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
            </div>
          </div>

        </form>

        <div className="px-6 py-5 border-t border-border shrink-0 flex justify-end gap-3 bg-surface-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:text-text hover:bg-surface-3 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent text-white transition-all shadow-md shadow-primary/25 disabled:opacity-50 flex items-center gap-2.5"
          >
            {saving ? 'กำลังบันทึก...' : (
              <>
                <Save className="w-4 h-4" />
                บันทึกการตั้งค่า
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
