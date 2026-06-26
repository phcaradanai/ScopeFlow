import { CheckCircle, FileText, Target, Briefcase, AlertTriangle, ArrowRight } from 'lucide-react';

import { WorkflowState } from '../../lib/project-workflow';

interface ProjectWorkflowStepperProps {
  workflowState: WorkflowState;
  clientId: string;
  projectPath: string;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, type: string) => void;
  onStartBriefIntake?: (clientId: string, projectId: string, projectPath: string) => void;
}

export default function ProjectWorkflowStepper({
  workflowState,
  clientId,
  projectPath,
  onCreateDocument,
  onStartBriefIntake
}: ProjectWorkflowStepperProps) {
  const projectId = projectPath.split('/').pop() || '';

  // Determine current active step index for UI
  const stepMap: Record<string, number> = {
    'brief': 1,
    'scope': 2,
    'quotation': 3,
    'approval': 4,
    'acceptance': 5,
    'done': 6
  };
  
  const currentStep = stepMap[workflowState.currentStep] || 1;
  const { nextActionLabel, nextActionDescription, targetDocumentType, readinessScore } = workflowState;

  const actionFunc = () => {
    if (targetDocumentType === 'brief' && onStartBriefIntake) {
      onStartBriefIntake(clientId, projectId, projectPath);
    } else if (targetDocumentType !== 'export' && targetDocumentType !== 'done') {
      onCreateDocument(clientId, projectId, projectPath, targetDocumentType);
    }
  };

  return (
    <div className="card !p-0 relative overflow-hidden flex flex-col md:flex-row items-stretch border-primary/20 shadow-[0_8px_30px_rgba(99,102,241,0.1)]">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Next Action Callout (Left) */}
      <div className="md:w-2/5 p-8 bg-primary/5 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary-light text-[10px] font-bold uppercase tracking-wider">
            Next Action
          </span>
          <span className="text-xs text-text-dim">Step {Math.min(currentStep, 5)} of 5</span>
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">{nextActionLabel}</h2>
        <p className="text-sm text-text-muted mb-6">{nextActionDescription}</p>
        
        {currentStep <= 5 && targetDocumentType !== 'export' && (
          <button 
            onClick={actionFunc}
            className="btn btn-primary w-fit flex items-center gap-2"
          >
            ดำเนินการตอนนี้ <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stepper (Right) */}
      <div className="md:w-3/5 p-8 relative z-10 flex flex-col justify-center overflow-x-auto">
        <div className="flex justify-between relative mt-4 min-w-[500px]">
          <div className="absolute top-6 left-[10%] right-[10%] h-0.5 bg-surface-3 z-0" />
          <div 
            className="absolute top-6 left-[10%] h-0.5 bg-primary z-0 transition-all duration-700 ease-in-out" 
            style={{ width: `${readinessScore}%` }} 
          />

          <StepItem 
            step={1} 
            currentStep={currentStep}
            icon={currentStep <= 1 ? <FileText className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            label="1. Brief"
            activeLabel="รวบรวมข้อมูล"
          />
          <StepItem 
            step={2} 
            currentStep={currentStep}
            icon={currentStep <= 2 ? <Target className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            label="2. Scope"
            activeLabel="กำหนดขอบเขต"
          />
          <StepItem 
            step={3} 
            currentStep={currentStep}
            icon={currentStep <= 3 ? <Briefcase className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            label="3. Quote"
            activeLabel="เสนอราคา"
          />
          <StepItem 
            step={4} 
            currentStep={currentStep}
            icon={currentStep <= 4 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            label="4. Approval"
            activeLabel="รออนุมัติ"
          />
          <StepItem 
            step={5} 
            currentStep={currentStep}
            icon={currentStep <= 5 ? <FileText className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            label="5. Accept"
            activeLabel="ตรวจรับ"
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
    <div className="flex flex-col items-center w-1/5 relative z-10">
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
