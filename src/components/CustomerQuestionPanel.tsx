import { Clipboard, HelpCircle, MessageSquareText, Send, SquareCheckBig } from 'lucide-react';
import type { CustomerQuestionPack } from '../lib/ai/scope-closure/customerQuestionLoop';

interface CustomerQuestionPanelProps {
  pack: CustomerQuestionPack;
}

export default function CustomerQuestionPanel({ pack }: CustomerQuestionPanelProps) {
  const copyMessage = async () => {
    await navigator.clipboard.writeText(`${pack.subject}\n\n${pack.message}`);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-primary" /> Customer Question Close Loop
          </h3>
          <p className="text-xs text-text-muted mt-1">ข้อความและ checklist สำหรับถามลูกค้าเพื่อปิด Scope ให้พร้อม quote</p>
        </div>
        <button type="button" onClick={copyMessage} className="btn btn-outline text-xs gap-2 w-full lg:w-auto">
          <Clipboard className="w-4 h-4" /> Copy Message
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> ข้อความสำหรับส่งลูกค้า
          </h4>
          <p className="text-xs font-semibold text-text mb-3">Subject: {pack.subject}</p>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-muted font-sans bg-surface-2 rounded-lg border border-border p-3 max-h-[260px] overflow-y-auto">
            {pack.message}
          </pre>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-warning" /> คำถามที่ต้องปิดก่อน Quote
          </h4>
          {pack.questions.length === 0 ? (
            <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-xs text-success flex gap-2 items-start">
              <SquareCheckBig className="w-4 h-4 flex-shrink-0" /> ไม่มีคำถามค้างหลักก่อนปิด Scope
            </div>
          ) : (
            <ul className="space-y-2">
              {pack.questions.map((item, index) => (
                <li key={item.id} className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-text-muted leading-relaxed">
                  <span className="font-semibold text-text">{index + 1}.</span> {item.question}
                  <div className="mt-2 text-[11px] text-warning">สถานะเริ่มต้น: still unclear — รอคำตอบลูกค้า</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
          <h4 className="text-xs font-bold text-primary-light mb-2">Close Loop Checklist</h4>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-muted font-mono">{pack.closeLoopChecklistMarkdown}</pre>
        </div>
      </div>
    </div>
  );
}
