import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  PackageCheck,
  ReceiptText,
  SearchCheck,
  Sparkles,
  X,
} from 'lucide-react';

interface DemoFlowGuideModalProps {
  projectPath: string;
  onOpenProject: (path: string) => void;
  onClose: () => void;
}

interface TutorialStep {
  title: string;
  goal: string;
  whatToLookFor: string[];
  actionLabel: string;
  targetPath: string;
  icon: typeof FileText;
}

function buildTutorialSteps(projectPath: string): TutorialStep[] {
  return [
    {
      title: 'เริ่มที่ภาพรวมโครงการ',
      goal: 'เข้าใจว่า Project Overview คือศูนย์กลางของงาน: เห็น Next Action, Scope Readiness, ความเสี่ยง และเอกสารทั้งหมด',
      whatToLookFor: [
        'ดูแถบ Scope Readiness ว่าเอกสารสำคัญครบหรือยัง',
        'ดูการ์ดเอกสารด้านล่างว่า Brief, Scope, Quote, Approval และ Acceptance อยู่ตรงไหน',
        'สังเกตว่า flow นี้จบครบแล้ว จึงควรเห็นเอกสารที่ approved/locked หลายตัว',
      ],
      actionLabel: 'เปิด Project Overview',
      targetPath: projectPath,
      icon: SearchCheck,
    },
    {
      title: 'เปิด Brief เพื่อดูคำขอลูกค้า',
      goal: 'ดูว่าคำขอที่ยังคลุมเครือถูกแปลงเป็น Brief ที่ใช้เริ่มงานได้อย่างไร',
      whatToLookFor: [
        'เป้าหมายหลักของลูกค้า',
        'Must-have หรือสิ่งจำเป็นที่ระบบต้องมี',
        'คำถามที่เคยไม่ชัดและถูก resolve แล้ว',
      ],
      actionLabel: 'เปิด Brief',
      targetPath: `${projectPath}/baseline/brief-v1.0.md`,
      icon: FileText,
    },
    {
      title: 'ตรวจ Scope เพื่อคุมขอบเขตงาน',
      goal: 'ดูว่า ScopeFlow ช่วยแยก In-Scope / Out-of-Scope / Deliverables / Acceptance Criteria เพื่อลด scope creep อย่างไร',
      whatToLookFor: [
        'In-Scope: สิ่งที่รับทำจริง',
        'Out-of-Scope: สิ่งที่ไม่รวม เพื่อกันงานบาน',
        'Acceptance Criteria: เงื่อนไขตรวจรับที่ลูกค้าและทีมต้องเห็นตรงกัน',
      ],
      actionLabel: 'เปิด Scope',
      targetPath: `${projectPath}/baseline/scope-v1.0.md`,
      icon: ClipboardCheck,
    },
    {
      title: 'ดู Quote และ Invoice',
      goal: 'ดูว่าขอบเขตงานถูกแปลงเป็นราคาและเอกสารเรียกเก็บเงินได้อย่างไร',
      whatToLookFor: [
        'Quotation มียอดรวม ส่วนลด VAT และ grand total',
        'Invoice แสดงงวดการชำระเงิน',
        'เอกสารราคาอ้างอิงจาก Scope ไม่ใช่คิดแยกจากขอบเขตงาน',
      ],
      actionLabel: 'เปิด Quotation',
      targetPath: `${projectPath}/baseline/quotation-v1.0.md`,
      icon: ReceiptText,
    },
    {
      title: 'ตรวจ Approval Record',
      goal: 'ดูหลักฐานการอนุมัติว่าเอกสารที่ approved/locked มี reference กลับไปยัง approval record',
      whatToLookFor: [
        'approval_number ตรงกับ approval_ref ในเอกสารหลัก',
        'approved_document ชี้กลับไปยัง Brief/Scope/Quote/Acceptance',
        'evidence file อยู่ใน attachments เพื่อใช้ตรวจสอบย้อนหลัง',
      ],
      actionLabel: 'เปิด Approval ของ Scope',
      targetPath: `${projectPath}/approvals/APR-SCOPE-${projectPath.split('-').pop()}.md`,
      icon: FileCheck2,
    },
    {
      title: 'ปิด loop ด้วย Acceptance และ Export',
      goal: 'ดูขั้นสุดท้ายของงาน: ตรวจรับแล้ว export ชุดเอกสารส่งมอบได้',
      whatToLookFor: [
        'Acceptance checklist ผ่านครบ',
        'เอกสารถูก locked หลังอนุมัติ',
        'มีไฟล์ export เพื่อส่งมอบหรือเก็บหลักฐานปิดงาน',
      ],
      actionLabel: 'เปิด Acceptance',
      targetPath: `${projectPath}/acceptance/acceptance-v1.0.md`,
      icon: PackageCheck,
    },
  ];
}

export default function DemoFlowGuideModal({ projectPath, onOpenProject, onClose }: DemoFlowGuideModalProps) {
  const steps = useMemo(() => buildTutorialSteps(projectPath), [projectPath]);
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  const openCurrentTarget = () => {
    onOpenProject(step.targetPath);
  };

  const handleNext = () => {
    if (isLast) {
      onOpenProject(projectPath);
      onClose();
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container demo-tutorial-modal">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-success">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Demo Tutorial
              </span>
              <span className="badge badge-muted">ขั้นที่ {currentStep + 1}/{steps.length}</span>
            </div>
            <h2 className="modal-title flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-success" />
              เดิน Demo ให้จบทั้ง ScopeFlow loop
            </h2>
            <p className="modal-subtitle">
              ทำตามทีละขั้นเพื่อเห็นภาพตั้งแต่คำขอลูกค้า → Brief → Scope → Quote → Approval → Acceptance → Export
            </p>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="ปิด tutorial">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <div className="demo-tutorial-progress" aria-label={`ความคืบหน้า ${progress}%`}>
            <div className="demo-tutorial-progress-bar" style={{ width: `${progress}%` }} />
          </div>

          <div className="demo-tutorial-layout">
            <aside className="demo-tutorial-steps" aria-label="รายการขั้นตอน demo">
              {steps.map((item, index) => {
                const StepIcon = item.icon;
                const active = index === currentStep;
                const done = index < currentStep;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`demo-tutorial-step ${active ? 'demo-tutorial-step-active' : ''}`}
                  >
                    <span className={`demo-tutorial-step-icon ${done ? 'demo-tutorial-step-icon-done' : ''}`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="demo-tutorial-step-title">{index + 1}. {item.title}</span>
                    </span>
                  </button>
                );
              })}
            </aside>

            <section className="demo-tutorial-card">
              <div className="demo-tutorial-card-icon">
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-text leading-tight">{step.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed mt-3">{step.goal}</p>

              <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <h4 className="text-sm font-bold text-text mb-3">ให้สังเกตอะไรบ้าง</h4>
                <ul className="space-y-2">
                  {step.whatToLookFor.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-text-muted leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary-light leading-relaxed break-all">
                Target: {step.targetPath}
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer demo-tutorial-footer">
          <button onClick={onClose} className="btn btn-ghost">ปิด Tutorial</button>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={isFirst}
              className="btn btn-ghost"
            >
              <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
            </button>
            <button onClick={openCurrentTarget} className="btn btn-outline">
              {step.actionLabel}
            </button>
            <button onClick={handleNext} className="btn btn-primary">
              {isLast ? 'จบ Tutorial' : 'ขั้นถัดไป'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
