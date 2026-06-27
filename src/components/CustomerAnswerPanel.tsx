import { useMemo, useState } from 'react';
import { ClipboardCheck, MessageCircleReply, RefreshCw, SquareCheckBig, TriangleAlert } from 'lucide-react';
import type { ScopeClosureGateResult } from '../lib/ai/scope-closure/scopeClosureGate';
import type { CustomerQuestionPack } from '../lib/ai/scope-closure/customerQuestionLoop';
import { applyCustomerAnswers, reevaluateGateWithCustomerAnswers } from '../lib/ai/scope-closure/customerAnswerLoop';

interface CustomerAnswerPanelProps {
  questionPack: CustomerQuestionPack;
  gate: ScopeClosureGateResult;
}

function badgeClass(disposition: string) {
  if (disposition === 'confirmed') return 'bg-success/10 text-success border-success/20';
  if (disposition === 'waived') return 'bg-primary/10 text-primary-light border-primary/20';
  return 'bg-warning/10 text-warning border-warning/20';
}

export default function CustomerAnswerPanel({ questionPack, gate }: CustomerAnswerPanelProps) {
  const [rawAnswerText, setRawAnswerText] = useState('');

  const answerResult = useMemo(() => applyCustomerAnswers({
    questions: questionPack.questions,
    rawAnswerText,
  }), [questionPack.questions, rawAnswerText]);

  const updatedGate = useMemo(() => reevaluateGateWithCustomerAnswers(gate, answerResult), [gate, answerResult]);
  const hasAnswer = rawAnswerText.trim().length > 0;

  return (
    <div className="rounded-2xl border border-border bg-surface-2 overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-3">
        <h3 className="text-sm font-bold text-text flex items-center gap-2">
          <MessageCircleReply className="w-4 h-4 text-primary" /> Customer Answer Apply Preview
        </h3>
        <p className="text-xs text-text-muted mt-1">วางคำตอบลูกค้าที่นี่เพื่อ preview ว่าคำถามถูกปิดเป็น confirmed / waived / still unclear หรือยัง</p>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <label className="text-xs font-bold text-text mb-2 block">วางคำตอบลูกค้า</label>
          <textarea
            value={rawAnswerText}
            onChange={(event) => setRawAnswerText(event.target.value)}
            placeholder={`เช่น:\n1. ใช้ Omise\n2. ยังไม่ทำ coupon ในเฟสแรก ไป phase 2\n3. ประมาณ 200 รายการ`}
            className="w-full min-h-[220px] bg-surface-2 border border-border rounded-xl text-text text-xs leading-relaxed p-3 outline-none focus:border-primary resize-y"
          />
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-text-muted leading-relaxed">
            <RefreshCw className="w-4 h-4 text-primary inline-block mr-1" />
            ระบบจะ preview เท่านั้น ยังไม่เขียนไฟล์จริงในขั้นนี้
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Confirmed</p>
              <p className="text-lg font-bold text-success">{answerResult.summary.confirmed_count}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Waived</p>
              <p className="text-lg font-bold text-primary-light">{answerResult.summary.waived_count}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Still unclear</p>
              <p className="text-lg font-bold text-warning">{answerResult.summary.still_unclear_count}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <p className="text-[11px] text-text-muted">Gate</p>
              <p className="text-sm font-bold text-text">{hasAnswer ? updatedGate.scope_closure_status : gate.scope_closure_status}</p>
            </div>
          </div>

          <div className={`rounded-xl border p-3 text-xs leading-relaxed ${answerResult.summary.all_closed ? 'border-success/20 bg-success/10 text-success' : 'border-warning/20 bg-warning/10 text-warning'}`}>
            {answerResult.summary.all_closed ? (
              <><SquareCheckBig className="w-4 h-4 inline-block mr-1" /> คำถามค้างถูกปิดครบแล้ว พร้อมตรวจ readiness เพื่อ quote อีกครั้ง</>
            ) : (
              <><TriangleAlert className="w-4 h-4 inline-block mr-1" /> ยังมีคำถามที่ไม่ชัด {answerResult.summary.still_unclear_count} รายการ</>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h4 className="text-xs font-bold text-text mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" /> Classification Preview
            </h4>
            <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {answerResult.updated_questions.map((item, index) => (
                <li key={item.id} className="rounded-lg border border-border bg-surface-2 p-3 text-xs leading-relaxed">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <p className="text-text-muted"><span className="font-semibold text-text">{index + 1}.</span> {item.question}</p>
                    <span className={`px-2 py-1 rounded-full border text-[11px] font-semibold w-fit ${badgeClass(item.disposition)}`}>{item.disposition}</span>
                  </div>
                  {item.answer && <p className="mt-2 text-text-dim">คำตอบ: {item.answer}</p>}
                  {item.note && <p className="mt-1 text-text-dim">หมายเหตุ: {item.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
          <h4 className="text-xs font-bold text-primary-light mb-2">Updated Close Loop Checklist</h4>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-text-muted font-mono">{answerResult.close_loop_checklist_markdown}</pre>
        </div>
      </div>
    </div>
  );
}
