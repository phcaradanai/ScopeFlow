import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  PackageCheck,
  ReceiptText,
  SearchCheck,
  Sparkles,
  X,
} from 'lucide-react';

interface DemoFlowGuideModalProps {
  projectPath: string;
  artifactPaths?: Record<string, string>;
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

function pathFor(artifactPaths: Record<string, string> | undefined, key: string, fallback: string) {
  return artifactPaths?.[key] || fallback;
}

function buildTutorialSteps(projectPath: string, artifactPaths?: Record<string, string>): TutorialStep[] {
  return [
    {
      title: 'เริ่มที่ Project Overview',
      goal: 'ใช้หน้านี้เป็นศูนย์กลางของงาน ก่อนเริ่มสร้างเอกสารจากคำขอลูกค้า',
      whatToLookFor: [
        'เปิด project ก่อน แล้วมองหาปุ่มเริ่มจากคำขอลูกค้า / Start Discovery',
        'ดูสถานะเอกสารและ next action ว่าระบบแนะนำให้ทำอะไรต่อ',
        'ทุกไฟล์ที่สร้างจาก Discovery จะถูกเก็บใน baseline ของ project นี้',
      ],
      actionLabel: 'เปิด Project Overview',
      targetPath: projectPath,
      icon: SearchCheck,
    },
    {
      title: 'เริ่ม Discovery จากคำขอลูกค้า',
      goal: 'วางข้อความจากลูกค้า แล้วให้ระบบถามต่อจนข้อมูลพร้อมพอสำหรับ Brief, Scope และ Quotation',
      whatToLookFor: [
        'วางคำขอลูกค้า แชท อีเมล หรือ note ประชุมใน Start Discovery',
        'ดู Readiness และ Next Best Question ก่อนสร้างเอกสาร',
        'ถ้าคำตอบยังไม่ครบ ให้ตอบคำถามเพิ่มก่อนกด generate',
      ],
      actionLabel: 'เปิด Project เพื่อเริ่ม Discovery',
      targetPath: projectPath,
      icon: MessageSquareText,
    },
    {
      title: 'สร้างและตรวจ Brief จาก Discovery',
      goal: 'ยืนยันว่าระบบเปลี่ยนคำขอลูกค้าเป็น Brief ที่เริ่มคุยงานต่อได้',
      whatToLookFor: [
        'ใน production จะได้ไฟล์ baseline/brief-from-discovery.md; ใน demo อาจเปิด brief-v1.0.md ที่สร้างไว้ให้ดูแทน',
        'Brief ต้องมีคำขอลูกค้า ข้อเท็จจริงที่ยืนยันแล้ว และคำถามที่ยังไม่ชัด',
        'ถ้าข้อมูลยังไม่พอ ให้กลับไป Discovery แล้วถามเพิ่ม',
      ],
      actionLabel: 'เปิด Brief',
      targetPath: pathFor(artifactPaths, 'brief', `${projectPath}/baseline/brief-from-discovery.md`),
      icon: FileText,
    },
    {
      title: 'สร้างและตรวจ Scope จาก Discovery',
      goal: 'ดูว่า ScopeFlow แยก In-Scope, Out-of-Scope, Deliverables และ Acceptance Criteria เพื่อกันงานบานอย่างไร',
      whatToLookFor: [
        'ใน production จะได้ไฟล์ baseline/scope-from-discovery.md; ใน demo อาจเปิด scope-v1.0.md ที่สร้างไว้ให้ดูแทน',
        'In-Scope ต้องสะท้อน feature/platform/data/integration ที่ลูกค้าตอบแล้ว',
        'Out-of-Scope ต้องบอกสิ่งที่ยังไม่ล็อกหรือยังไม่รวม',
      ],
      actionLabel: 'เปิด Scope',
      targetPath: pathFor(artifactPaths, 'scope', `${projectPath}/baseline/scope-from-discovery.md`),
      icon: ClipboardCheck,
    },
    {
      title: 'สร้างและตรวจ Quotation จาก Discovery',
      goal: 'ดูว่าข้อมูลเชิงพาณิชย์ เช่น งบประมาณ เวลา และขอบเขต ถูกแปลงเป็นใบเสนอราคาตั้งต้นได้อย่างไร',
      whatToLookFor: [
        'ใน production จะได้ไฟล์ baseline/quotation-from-discovery.md; ใน demo อาจเปิด quotation-v1.0.md ที่สร้างไว้ให้ดูแทน',
        'Quotation ต้องอ้างอิง Scope และแสดง line items, VAT, grand total และ payment terms',
        'ถ้างบหรือเงื่อนไขยังไม่ชัด ให้ถือว่าเป็น draft และกลับไปถามลูกค้าเพิ่ม',
      ],
      actionLabel: 'เปิด Quotation',
      targetPath: pathFor(artifactPaths, 'quotation', `${projectPath}/baseline/quotation-from-discovery.md`),
      icon: ReceiptText,
    },
    {
      title: 'ไปต่อหลังเอกสารหลักครบ',
      goal: 'เมื่อ Brief, Scope และ Quotation พร้อมแล้ว จึงค่อยเดินงานตรวจรับ ปิดงาน และ export ชุดเอกสาร',
      whatToLookFor: [
        'Project ควรมี Brief, Scope และ Quotation ที่มาจาก Discovery Session เดียวกัน',
        'ใช้ Scope และ Quotation ที่ตกลงแล้วเป็นฐานก่อนเริ่มส่งมอบงาน',
        'หลังจากนั้นจึงค่อยใช้ Acceptance และ Export เพื่อปิด loop',
      ],
      actionLabel: 'เปิด Acceptance / Closeout',
      targetPath: pathFor(artifactPaths, 'acceptance', `${projectPath}/acceptance/acceptance-v1.0.md`),
      icon: PackageCheck,
    },
  ];
}

export default function DemoFlowGuideModal({ projectPath, artifactPaths, onOpenProject, onClose }: DemoFlowGuideModalProps) {
  const steps = useMemo(() => buildTutorialSteps(projectPath, artifactPaths), [projectPath, artifactPaths]);
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  const openCurrentTarget = () => onOpenProject(step.targetPath);

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
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Discovery-first Tutorial
              </span>
              <span className="badge badge-muted">ขั้นที่ {currentStep + 1}/{steps.length}</span>
            </div>
            <h2 className="modal-title flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-success" />
              เดิน MVP ให้จบ: Discovery → Brief → Scope → Quotation
            </h2>
            <p className="modal-subtitle">
              ทำตามทีละขั้นเพื่อเห็น flow จริง: เริ่มจากคำขอลูกค้า ถามต่อจนข้อมูลพร้อม แล้วสร้างเอกสารหลักจาก Discovery Session เดียวกัน
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
                <h4 className="text-sm font-bold text-text mb-3">Checklist ที่ต้องเห็น</h4>
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
            <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={isFirst} className="btn btn-ghost">
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
