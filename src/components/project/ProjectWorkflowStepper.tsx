import { CheckCircle, FileText, Target, Briefcase, AlertTriangle, ArrowRight } from 'lucide-react';

interface ProjectWorkflowStepperProps {
  hasNoBrief: boolean;
  hasNoScope: boolean;
  hasNoQuote: boolean;
  approvedDocs: number;
  clientId: string;
  projectPath: string;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, type: string) => void;
  onStartBriefIntake?: (clientId: string, projectId: string, projectPath: string) => void;
}

export default function ProjectWorkflowStepper({
  hasNoBrief,
  hasNoScope,
  hasNoQuote,
  approvedDocs,
  clientId,
  projectPath,
  onCreateDocument,
  onStartBriefIntake
}: ProjectWorkflowStepperProps) {
  const projectId = projectPath.split('/').pop() || '';

  // Determine current active step
  let currentStep = 1;
  let actionTitle = "สร้างเอกสาร Brief";
  let actionDesc = "รวบรวมความต้องการของลูกค้าเพื่อเป็นตั้งต้นในการทำ Scope";
  let actionFunc = () => { if (onStartBriefIntake) onStartBriefIntake(clientId, projectId, projectPath); };
  
  if (!hasNoBrief) {
    currentStep = 2;
    actionTitle = "กำหนดขอบเขตงาน (Scope)";
    actionDesc = "นำข้อมูลจาก Brief มาจัดทำเอกสารขอบเขตงาน";
    actionFunc = () => { onCreateDocument(clientId, projectId, projectPath, 'scope'); };
  }
  if (!hasNoBrief && !hasNoScope) {
    currentStep = 3;
    actionTitle = "ออกใบเสนอราคา";
    actionDesc = "ประเมินราคาจากขอบเขตงานที่กำหนด";
    actionFunc = () => { onCreateDocument(clientId, projectId, projectPath, 'quotation'); };
  }
  if (!hasNoBrief && !hasNoScope && !hasNoQuote) {
    currentStep = 4;
    actionTitle = "รอการอนุมัติ";
    actionDesc = "ติดตามการอนุมัติเอกสารจากผู้มีอำนาจ";
    actionFunc = () => {}; // Usually approval is a status, not a direct creation action here
  }
  if (approvedDocs >= 2) {
    currentStep = 5;
    actionTitle = "พร้อมดำเนินการ";
    actionDesc = "เอกสารครบถ้วนและได้รับการอนุมัติแล้ว";
  }

  return (
    <div className="card !p-0 relative overflow-hidden flex flex-col md:flex-row items-stretch border-primary/20 shadow-[0_8px_30px_rgba(99,102,241,0.1)]">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Next Action Callout (Left) */}
      <div className="md:w-2/5 p-8 bg-primary/5 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary-light text-[10px] font-bold uppercase tracking-wider">
            Next Action
          </span>
          <span className="text-xs text-text-dim">Step {Math.min(currentStep, 4)} of 4</span>
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">{actionTitle}</h2>
        <p className="text-sm text-text-muted mb-6">{actionDesc}</p>
        
        {currentStep <= 3 && (
          <button 
            onClick={actionFunc}
            className="btn btn-primary w-fit flex items-center gap-2"
          >
            ดำเนินการตอนนี้ <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stepper (Right) */}
      <div className="md:w-3/5 p-8 relative z-10 flex flex-col justify-center">
        <div className="flex justify-between relative mt-4">
          <div className="absolute top-6 left-[12.5%] right-[12.5%] h-0.5 bg-surface-3 z-0" />
          <div 
            className="absolute top-6 left-[12.5%] h-0.5 bg-primary z-0 transition-all duration-700 ease-in-out" 
            style={{ width: `${hasNoBrief ? 0 : hasNoScope ? 33 : hasNoQuote ? 66 : 100}%` }} 
          />

          <StepItem 
            step={1} 
            currentStep={currentStep}
            icon={hasNoBrief ? <FileText className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            label="1. Brief"
            activeLabel="รวบรวมข้อมูล"
          />
          <StepItem 
            step={2} 
            currentStep={currentStep}
            icon={hasNoScope ? <Target className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            label="2. Scope"
            activeLabel="กำหนดขอบเขต"
          />
          <StepItem 
            step={3} 
            currentStep={currentStep}
            icon={hasNoQuote ? <Briefcase className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            label="3. Quotation"
            activeLabel="เสนอราคา"
          />
          <StepItem 
            step={4} 
            currentStep={currentStep}
            icon={approvedDocs >= 2 ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            label="4. Approval"
            activeLabel={approvedDocs >= 2 ? "อนุมัติแล้ว" : "รออนุมัติ"}
          />
        </div>
      </div>
    </div>
  );
}

function StepItem({ step, currentStep, icon, label, activeLabel }: { step: number; currentStep: number; icon: React.ReactNode; label: string; activeLabel: string }) {
  const isPast = currentStep > step;
  const isCurrent = currentStep === step;
  
  return (
    <div className="flex flex-col items-center w-1/4 relative z-10">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
          isPast 
            ? 'bg-success/20 text-success border border-success/30' 
            : isCurrent 
              ? 'bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
              : 'bg-surface-2 text-text-dim border border-border'
        }`}
      >
        {icon}
      </div>
      <span className={`font-semibold text-xs ${isCurrent ? 'text-primary-light' : isPast ? 'text-text' : 'text-text-muted'}`}>
        {label}
      </span>
      <span className="text-[10px] text-text-dim mt-1 text-center hidden sm:block">
        {isPast ? 'เสร็จสิ้น' : isCurrent ? activeLabel : 'รอรับการทำงาน'}
      </span>
    </div>
  );
}
