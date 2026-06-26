import { ArrowRight, CheckCircle2, FileText, X } from 'lucide-react';

interface DemoFlowGuideModalProps {
  projectPath: string;
  onOpenProject: (path: string) => void;
  onClose: () => void;
}

const steps = [
  {
    title: '1. ดูภาพรวมโครงการ',
    detail: 'เริ่มที่ Project Overview เพื่อดู Scope Readiness และเอกสารทั้งหมดใน flow',
  },
  {
    title: '2. เปิด Brief',
    detail: 'ดูว่าคำขอลูกค้าถูกแปลงเป็น Brief ที่อนุมัติแล้วอย่างไร',
  },
  {
    title: '3. ตรวจ Scope',
    detail: 'ดู In-Scope, Out-of-Scope, Deliverables, Acceptance Criteria และ Assumptions',
  },
  {
    title: '4. ดู Quote / Invoice',
    detail: 'เช็ก flow ฝั่งราคาและการชำระเงินที่ผูกกับ scope แล้ว',
  },
  {
    title: '5. ตรวจ Approval / Acceptance / Export',
    detail: 'ดูหลักฐานการอนุมัติ เอกสารตรวจรับ และไฟล์ export เพื่อปิดงานครบ loop',
  },
];

export default function DemoFlowGuideModal({ projectPath, onOpenProject, onClose }: DemoFlowGuideModalProps) {
  const handleOpenProject = () => {
    onOpenProject(projectPath);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container modal-container-sm">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Demo จบครบ Flow พร้อมใช้งาน
            </h2>
            <p className="modal-subtitle">
              ใช้ modal นี้เป็นคู่มือเดินระบบตั้งแต่คำขอลูกค้าจนถึงตรวจรับและ export
            </p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <div className="rounded-2xl border border-success/20 bg-success/10 p-4 text-sm text-success flex items-start gap-3">
            <FileText className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">โครงการ demo ถูกสร้างแล้ว</div>
              <div className="mt-1 text-success/80 break-all text-xs">{projectPath}</div>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                <h3 className="text-sm font-bold text-text">{step.title}</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary-light leading-relaxed">
            เป้าหมายของ demo นี้คือให้เห็นภาพว่า ScopeFlow ไม่ใช่แค่เก็บไฟล์ แต่ช่วยคุม flow งานจาก Brief → Scope → Quote → Approval → Acceptance → Export
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-ghost">ปิดไว้ก่อน</button>
          <button onClick={handleOpenProject} className="btn btn-primary">
            เปิดโครงการ Demo
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
