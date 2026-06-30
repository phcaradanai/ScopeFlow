import { CheckCircle2, FileText, MessageSquareText, ReceiptText, Route, Sparkles } from 'lucide-react';

interface MvpGuidedPathProps {
  hasBrief: boolean;
  hasScope: boolean;
  hasQuotation: boolean;
  onStartDiscovery?: () => void;
}

interface Step {
  label: string;
  description: string;
  done: boolean;
  icon: typeof FileText;
}

export default function MvpGuidedPath({ hasBrief, hasScope, hasQuotation, onStartDiscovery }: MvpGuidedPathProps) {
  const steps: Step[] = [
    {
      label: '1. Start Discovery',
      description: 'วางคำขอลูกค้า แล้วตอบคำถามที่ระบบแนะนำก่อนออกเอกสาร',
      done: hasBrief || hasScope || hasQuotation,
      icon: MessageSquareText,
    },
    {
      label: '2. Generate Brief',
      description: 'สร้าง baseline/brief-from-discovery.md จากข้อมูลที่ถามได้',
      done: hasBrief,
      icon: FileText,
    },
    {
      label: '3. Generate Scope',
      description: 'สร้าง baseline/scope-from-discovery.md เพื่อคุม in/out scope',
      done: hasScope,
      icon: Route,
    },
    {
      label: '4. Generate Quotation',
      description: 'สร้าง baseline/quotation-from-discovery.md เพื่อเสนอราคา draft',
      done: hasQuotation,
      icon: ReceiptText,
    },
  ];

  const complete = hasBrief && hasScope && hasQuotation;

  return (
    <section className="rounded-3xl border border-primary/20 bg-primary/10 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-success">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> MVP Guided Path
            </span>
            <span className="badge badge-muted">Discovery-first</span>
          </div>
          <h2 className="text-lg font-extrabold text-text">เริ่มตรงนี้เพื่อสร้างเอกสารหลักให้ครบ</h2>
          <p className="text-sm text-text-muted leading-relaxed mt-1">
            ผู้ใช้ใหม่ให้เดินตามลำดับนี้: Start Discovery → Brief → Scope → Quotation โดยทุกเอกสารใช้ Discovery Session เดียวกัน
          </p>
        </div>
        <button type="button" className="btn btn-primary shrink-0" onClick={onStartDiscovery} disabled={!onStartDiscovery}>
          <MessageSquareText className="w-4 h-4" /> Start Discovery
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="rounded-2xl border border-white/10 bg-surface/60 p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${step.done ? 'border-success/30 bg-success/10 text-success' : 'border-primary/20 bg-primary/10 text-primary-light'}`}>
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-text">{step.label}</div>
                  <p className="text-xs text-text-muted leading-relaxed mt-1">{step.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-4 rounded-2xl border p-3 text-sm ${complete ? 'border-success/20 bg-success/10 text-success' : 'border-warning/20 bg-warning/10 text-warning'}`}>
        {complete
          ? 'พร้อมแล้ว: project นี้มี Brief, Scope และ Quotation จาก Discovery ครบสำหรับเริ่มคุยกับลูกค้าหรือทีมต่อ'
          : 'ยังไม่ครบ: กด Start Discovery แล้วสร้าง Brief, Scope และ Quotation ให้ครบก่อนประกาศว่าเอกสารพร้อม'}
      </div>
    </section>
  );
}
