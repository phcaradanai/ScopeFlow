import React from 'react';
import { ScopeDigestOutput } from '../lib/ai/scope-digest/scopeDigestSchema';
import { X, Plus, AlertCircle, CheckCircle2, HelpCircle, ShieldAlert, ListChecks, Lightbulb } from 'lucide-react';

interface ScopeDigestPreviewProps {
  digest: ScopeDigestOutput;
  onChange: (updatedDigest: ScopeDigestOutput) => void;
}

export default function ScopeDigestPreview({ digest, onChange }: ScopeDigestPreviewProps) {
  const handleChange = (field: keyof ScopeDigestOutput, index: number, value: string) => {
    const list = [...(digest[field] as string[])];
    list[index] = value;
    onChange({ ...digest, [field]: list });
  };

  const handleRemove = (field: keyof ScopeDigestOutput, index: number) => {
    const list = [...(digest[field] as string[])];
    list.splice(index, 1);
    onChange({ ...digest, [field]: list });
  };

  const handleAdd = (field: keyof ScopeDigestOutput) => {
    const list = [...(digest[field] as string[])];
    list.push('');
    onChange({ ...digest, [field]: list });
  };

  const renderSection = (
    title: string,
    field: keyof ScopeDigestOutput,
    icon: React.ReactNode,
    colorClass: string
  ) => {
    const items = (digest[field] as string[]) || [];
    return (
      <div className={`p-4 rounded-xl border border-border bg-surface shadow-sm mb-4`}>
        <div className={`flex items-center justify-between mb-3 ${colorClass}`}>
          <h4 className="font-semibold flex items-center gap-2">
            {icon}
            {title}
          </h4>
          <button
            type="button"
            onClick={() => handleAdd(field)}
            className="p-1 hover:bg-surface-3 rounded text-text-dim hover:text-text transition-colors"
            title="เพิ่มรายการ"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 group">
              <input
                type="text"
                value={item}
                onChange={(e) => handleChange(field, idx, e.target.value)}
                className="flex-1 bg-surface-2 border border-transparent focus:border-primary/30 rounded-lg px-3 py-1.5 text-sm outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => handleRemove(field, idx)}
                className="p-1.5 text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-text-muted italic">ไม่มีข้อมูล</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-surface-2 border border-border">
        <span className="text-sm text-text-muted">ประเภทโครงการที่ตรวจพบ:</span>
        <span className="text-sm font-semibold text-primary">{digest.detected_project_type}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          {renderSection('สิ่งที่เข้าใจ', 'understanding', <Lightbulb className="w-4 h-4" />, 'text-primary-light')}
          {renderSection('สิ่งที่ยืนยันแล้ว', 'confirmed_facts', <CheckCircle2 className="w-4 h-4" />, 'text-success')}
          {renderSection('สมมติฐาน', 'assumptions', <AlertCircle className="w-4 h-4" />, 'text-info')}
        </div>
        <div className="flex flex-col">
          {renderSection('สิ่งที่ยังไม่ชัด', 'unclear_points', <HelpCircle className="w-4 h-4" />, 'text-warning')}
          {renderSection('คำถามที่ควรถามลูกค้า', 'questions_to_ask', <HelpCircle className="w-4 h-4" />, 'text-warning')}
        </div>
      </div>
      
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSection('อาจอยู่ในขอบเขต', 'likely_in_scope', <ListChecks className="w-4 h-4" />, 'text-primary')}
        {renderSection('ควรระบุว่าไม่รวม', 'likely_out_of_scope', <X className="w-4 h-4" />, 'text-error')}
      </div>

      <div className="mt-2">
        {renderSection('ความเสี่ยงงานงอก', 'scope_creep_risks', <ShieldAlert className="w-4 h-4" />, 'text-error')}
      </div>
    </div>
  );
}
