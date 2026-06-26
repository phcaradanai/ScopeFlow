import { useState, useEffect } from 'react';
import { X, Building2, Save } from 'lucide-react';
import { CompanyProfile, getCompanyProfile, saveCompanyProfile, AiSettings, getAiSettings, saveAiSettings } from '../lib/settings';
import { testOllamaConnection } from '../lib/ai/ollamaConnectionTest';
import SelectField from './ui/SelectField';

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
  const [aiSettings, setAiSettings] = useState<AiSettings>({
    mode: 'off',
    baseUrl: 'http://localhost:11434',
    model: 'llama3',
    enabled: false
  });
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
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
        const aiData = await getAiSettings(workspacePath);
        if (aiData) {
          setAiSettings(aiData);
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

  const handleAiChange = (field: keyof AiSettings, value: string | boolean) => {
    setAiSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTestOllama = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const status = await testOllamaConnection(aiSettings.baseUrl, aiSettings.model);
      setTestStatus(status);
    } catch {
      setTestStatus('การทดสอบล้มเหลว');
    } finally {
      setIsTesting(false);
    }
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
      await saveAiSettings(workspacePath, aiSettings);
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
      <div className="modal-overlay">
        <div className="modal-container modal-container-sm">
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-text-muted font-medium">กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-container-sm">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-primary" />
              ข้อมูลผู้ให้บริการ
            </h2>
            <p className="modal-subtitle">จัดการข้อมูลบริษัท/ฟรีแลนซ์สำหรับเอกสาร</p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-medium">
              {error}
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section-title">ข้อมูลทั่วไป</h3>
            <p className="form-section-helper">ชื่อ บริษัท/ผู้ให้บริการ และข้อมูลหลักๆ</p>
            
            <div className="form-field-row">
              <div className="form-field">
                <label className="form-label">
                  ชื่อบริษัท / ผู้ให้บริการ <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={profile.provider_name}
                  onChange={e => handleChange('provider_name', e.target.value)}
                  className="form-input"
                  placeholder="เช่น บริษัท สโคปโฟลว์ จำกัด"
                />
              </div>
              <div className="form-field">
                <label className="form-label">ประเภท</label>
                <SelectField
                  value={profile.provider_type || 'company'}
                  onChange={val => handleChange('provider_type', val)}
                  options={[
                    { value: 'company', label: 'บริษัท (Company)' },
                    { value: 'agency', label: 'เอเจนซี่ (Agency)' },
                    { value: 'freelancer', label: 'ฟรีแลนซ์ (Freelancer)' },
                  ]}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">ที่อยู่ (Address)</label>
              <textarea
                value={profile.address || ''}
                onChange={e => handleChange('address', e.target.value)}
                rows={3}
                className="form-textarea"
                placeholder="ที่อยู่สำหรับออกเอกสาร"
              />
            </div>

            <div className="form-field">
              <label className="form-label">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
              <input
                type="text"
                value={profile.tax_id || ''}
                onChange={e => handleChange('tax_id', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">ข้อมูลติดต่อ</h3>
            <p className="form-section-helper">ช่องทางการติดต่อ</p>
            
            <div className="form-field-row">
              <div className="form-field">
                <label className="form-label">ชื่อผู้ติดต่อ (Contact Name)</label>
                <input
                  type="text"
                  value={profile.contact_name || ''}
                  onChange={e => handleChange('contact_name', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">เบอร์โทรศัพท์ (Phone)</label>
                <input
                  type="text"
                  value={profile.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-field-row">
              <div className="form-field">
                <label className="form-label">อีเมล (Email)</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={e => handleChange('email', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">เว็บไซต์ (Website)</label>
                <input
                  type="text"
                  value={profile.website || ''}
                  onChange={e => handleChange('website', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">LINE ID</label>
              <input
                type="text"
                value={profile.line_id || ''}
                onChange={e => handleChange('line_id', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">ค่าเริ่มต้นเอกสาร</h3>
            <p className="form-section-helper">ตั้งค่าเริ่มต้นสำหรับใบเสนอราคาและเอกสาร</p>
            
            <div className="form-field-row">
              <div className="form-field">
                <label className="form-label">สกุลเงินเริ่มต้น (Currency)</label>
                <input
                  type="text"
                  value={profile.default_currency || 'THB'}
                  onChange={e => handleChange('default_currency', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">VAT เริ่มต้น (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.default_vat_percent ?? 7}
                  onChange={e => handleChange('default_vat_percent', parseFloat(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">เงื่อนไขการชำระเงิน</label>
              <textarea
                value={profile.default_payment_terms || ''}
                onChange={e => handleChange('default_payment_terms', e.target.value)}
                rows={2}
                className="form-textarea"
                placeholder="เช่น ชำระ 30% ล่วงหน้า, 70% หลังส่งมอบ"
              />
            </div>

            <div className="form-field">
              <label className="form-label">เงื่อนไขประกัน</label>
              <textarea
                value={profile.default_warranty_terms || ''}
                onChange={e => handleChange('default_warranty_terms', e.target.value)}
                rows={2}
                className="form-textarea"
                placeholder="เช่น รับประกันระบบ 90 วันนับจากวันที่ส่งมอบ"
              />
            </div>

            <div className="form-field">
              <label className="form-label">เงื่อนไขการซัพพอร์ต</label>
              <textarea
                value={profile.default_support_terms || ''}
                onChange={e => handleChange('default_support_terms', e.target.value)}
                rows={2}
                className="form-textarea"
                placeholder="เช่น ซัพพอร์ตฟรี 30 วัน, thereafter บาท/ครั้ง"
              />
            </div>
          </div>

          <div className="form-section border-t border-border pt-6 mt-6">
            <h3 className="form-section-title">AI Assistant / Ollama Local</h3>
            <p className="form-section-helper">ตั้งค่าการใช้งาน AI ช่วยย่อยข้อมูล (ทำงานแบบ Local ไม่มีข้อมูลหลุดรอด)</p>
            
            <div className="form-field-row items-center mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.enabled}
                  onChange={e => handleAiChange('enabled', e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-text">เปิดใช้งาน AI Digest</span>
              </label>
            </div>

            {aiSettings.enabled && (
              <>
                <div className="form-field-row">
                  <div className="form-field">
                    <label className="form-label">โหมดการทำงาน (Mode)</label>
                    <SelectField
                      value={aiSettings.mode}
                      onChange={val => handleAiChange('mode', val)}
                      options={[
                        { value: 'off', label: 'ปิด (Off)' },
                        { value: 'ollama', label: 'Ollama (Local)' },
                      ]}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Ollama Base URL</label>
                    <input
                      type="text"
                      value={aiSettings.baseUrl}
                      onChange={e => handleAiChange('baseUrl', e.target.value)}
                      className="form-input"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                </div>

                <div className="form-field-row items-end">
                  <div className="form-field flex-1">
                    <label className="form-label">ชื่อโมเดล (Model Name)</label>
                    <input
                      type="text"
                      value={aiSettings.model}
                      onChange={e => handleAiChange('model', e.target.value)}
                      className="form-input"
                      placeholder="llama3"
                    />
                  </div>
                  <div className="form-field">
                    <button
                      type="button"
                      onClick={handleTestOllama}
                      disabled={isTesting || !aiSettings.baseUrl || !aiSettings.model}
                      className="btn btn-outline h-[42px]"
                    >
                      {isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
                    </button>
                  </div>
                </div>
                
                {testStatus && (
                  <div className={`mt-2 p-3 rounded-lg text-sm font-medium ${
                    testStatus.includes('สำเร็จ') ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                  }`}>
                    {testStatus}
                  </div>
                )}
              </>
            )}
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-ghost">
            ยกเลิก
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
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