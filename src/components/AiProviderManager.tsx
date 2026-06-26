import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, Server, Plus, Trash2 } from 'lucide-react';
import { getAiProviders, saveAiProviders } from '../lib/ai/providers/providerSettings';
import { getProviderApiKey, setProviderApiKey } from '../lib/ai/providers/providerSecrets';
import { testConnection, fetchModels } from '../lib/ai/providers/aiProviderRouter';
import { AiProvidersData, AiProvider, ProviderType } from '../lib/ai/providers/types';
import SelectField from './ui/SelectField';

interface AiProviderManagerProps {
  workspacePath: string;
}

export default function AiProviderManager({ workspacePath }: AiProviderManagerProps) {
  const [data, setData] = useState<AiProvidersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeKeys, setActiveKeys] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<Record<string, { status: string; isError: boolean }>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});
  const [isFetchingModels, setIsFetchingModels] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspacePath]);

  async function loadData() {
    setLoading(true);
    try {
      const providersData = await getAiProviders(workspacePath);
      setData(providersData);
      
      const keys: Record<string, string> = {};
      for (const p of providersData.providers) {
        if (p.apiKeyRef) {
          const key = await getProviderApiKey(workspacePath, p.apiKeyRef);
          if (key) keys[p.apiKeyRef] = key;
        }
      }
      setActiveKeys(keys);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveData(newData: AiProvidersData) {
    setData(newData);
    await saveAiProviders(workspacePath, newData);
  }

  async function handleKeyChange(_providerId: string, apiKeyRef: string, val: string) {
    setActiveKeys(prev => ({ ...prev, [apiKeyRef]: val }));
    await setProviderApiKey(workspacePath, apiKeyRef, val);
  }

  function updateProvider(id: string, updates: Partial<AiProvider>) {
    if (!data) return;
    const newData = {
      ...data,
      providers: data.providers.map(p => p.id === id ? { ...p, ...updates } : p)
    };
    handleSaveData(newData);
  }

  function addProvider() {
    if (!data) return;
    const newId = `provider-${Date.now()}`;
    const newProvider: AiProvider = {
      id: newId,
      name: 'New Provider',
      type: 'openai-compatible',
      baseUrl: '',
      model: '',
      apiKeyRef: newId
    };
    const newData = {
      ...data,
      providers: [...data.providers, newProvider]
    };
    handleSaveData(newData);
  }

  function removeProvider(id: string) {
    if (!data) return;
    const newData = {
      ...data,
      providers: data.providers.filter(p => p.id !== id),
      activeProviderId: data.activeProviderId === id ? (data.providers.find(p => p.id !== id)?.id || '') : data.activeProviderId
    };
    handleSaveData(newData);
  }

  async function handleTest(provider: AiProvider) {
    setIsTesting(prev => ({ ...prev, [provider.id]: true }));
    setTestStatus(prev => ({ ...prev, [provider.id]: { status: '', isError: false } }));
    try {
      const status = await testConnection(workspacePath, provider);
      setTestStatus(prev => ({
        ...prev,
        [provider.id]: { status, isError: !status.includes('สำเร็จ') }
      }));
    } catch (err: any) {
      setTestStatus(prev => ({
        ...prev,
        [provider.id]: { status: err.message || 'การทดสอบล้มเหลว', isError: true }
      }));
    } finally {
      setIsTesting(prev => ({ ...prev, [provider.id]: false }));
    }
  }

  async function handleFetchModels(provider: AiProvider) {
    setIsFetchingModels(prev => ({ ...prev, [provider.id]: true }));
    setTestStatus(prev => ({ ...prev, [provider.id]: { status: '', isError: false } }));
    try {
      const models = await fetchModels(workspacePath, provider);
      updateProvider(provider.id, { modelList: models, lastModelRefreshAt: new Date().toISOString() });
      setTestStatus(prev => ({
        ...prev,
        [provider.id]: { status: `พบ ${models.length} โมเดล`, isError: false }
      }));
    } catch (err: any) {
      setTestStatus(prev => ({
        ...prev,
        [provider.id]: { status: err.message || 'ไม่สามารถดึงข้อมูลโมเดลได้ ให้กรอกเอง', isError: true }
      }));
    } finally {
      setIsFetchingModels(prev => ({ ...prev, [provider.id]: false }));
    }
  }

  if (loading || !data) {
    return <div className="text-sm text-text-muted">กำลังโหลดข้อมูล AI Provider...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 cursor-pointer mb-2">
        <input
          type="checkbox"
          checked={data.enabled}
          onChange={e => handleSaveData({ ...data, enabled: e.target.checked })}
          className="rounded border-border text-primary focus:ring-primary/20"
          id="enable-ai"
        />
        <label htmlFor="enable-ai" className="text-sm font-medium text-text cursor-pointer">
          เปิดใช้งาน AI Digest (Scope Digest)
        </label>
      </div>

      {data.enabled && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-text">รายการ AI Provider</h4>
              <button
                type="button"
                onClick={addProvider}
                className="btn btn-outline h-8 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                เพิ่ม Provider
              </button>
            </div>

            <div className="space-y-4">
              {data.providers.map(provider => {
                const isActive = data.activeProviderId === provider.id;
                return (
                  <div key={provider.id} className={`p-4 rounded-xl border ${isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-surface'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="activeProvider"
                          checked={isActive}
                          onChange={() => handleSaveData({ ...data, activeProviderId: provider.id })}
                          className="text-primary focus:ring-primary/20"
                        />
                        <input
                          type="text"
                          value={provider.name}
                          onChange={e => updateProvider(provider.id, { name: e.target.value })}
                          className="font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 text-sm"
                          placeholder="ชื่อ Provider"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProvider(provider.id)}
                        className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        title="ลบ Provider"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-field">
                        <label className="form-label">ประเภท (Type)</label>
                        <SelectField
                          value={provider.type}
                          onChange={(val) => updateProvider(provider.id, { type: val as ProviderType })}
                          options={[
                            { value: 'ollama', label: 'Ollama Local' },
                            { value: 'openai-compatible', label: 'OpenAI-compatible' }
                          ]}
                        />
                      </div>
                      
                      <div className="form-field">
                        <label className="form-label">Base URL</label>
                        <input
                          type="text"
                          value={provider.baseUrl}
                          onChange={e => updateProvider(provider.id, { baseUrl: e.target.value })}
                          className="form-input"
                          placeholder={provider.type === 'ollama' ? "http://localhost:11434" : "https://api.openai.com/v1"}
                        />
                      </div>

                      {provider.type === 'openai-compatible' && provider.apiKeyRef && (
                        <div className="form-field">
                          <label className="form-label">API Key</label>
                          <div className="relative">
                            <input
                              type={showKey[provider.id] ? "text" : "password"}
                              value={activeKeys[provider.apiKeyRef] || ''}
                              onChange={e => handleKeyChange(provider.id, provider.apiKeyRef!, e.target.value)}
                              className="form-input pr-10"
                              placeholder="sk-..."
                            />
                            <button
                              type="button"
                              onClick={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text rounded-md"
                            >
                              {showKey[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="form-field">
                        <label className="form-label">โมเดล (Model)</label>
                        <div className="flex gap-2">
                          {provider.modelList && provider.modelList.length > 0 ? (
                            <SelectField
                              value={provider.model}
                              onChange={(val) => updateProvider(provider.id, { model: val })}
                              options={[
                                { value: '', label: '-- เลือกโมเดล --' },
                                ...provider.modelList.map(m => ({ value: m, label: m }))
                              ]}
                            />
                          ) : (
                            <input
                              type="text"
                              value={provider.model}
                              onChange={e => updateProvider(provider.id, { model: e.target.value })}
                              className="form-input"
                              placeholder="เช่น llama3, gpt-4o"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleFetchModels(provider)}
                            disabled={isFetchingModels[provider.id] || !provider.baseUrl}
                            className="btn btn-outline px-3"
                            title="ดึงรายชื่อโมเดล"
                          >
                            <RefreshCw className={`w-4 h-4 ${isFetchingModels[provider.id] ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs">
                        {testStatus[provider.id] && (
                          <span className={`flex items-center gap-1.5 ${testStatus[provider.id].isError ? 'text-error' : 'text-success'}`}>
                            {testStatus[provider.id].isError ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {testStatus[provider.id].status}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTest(provider)}
                        disabled={isTesting[provider.id] || !provider.baseUrl || (!provider.model && provider.type !== 'openai-compatible')}
                        className="btn btn-outline h-8 px-3 text-xs"
                      >
                        <Server className="w-3.5 h-3.5 mr-1" />
                        {isTesting[provider.id] ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}
