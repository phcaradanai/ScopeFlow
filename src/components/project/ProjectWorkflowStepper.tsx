import { CheckCircle, FileText, Target, Briefcase, AlertTriangle } from 'lucide-react';

interface ProjectWorkflowStepperProps {
  scopeReady: boolean;
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
  scopeReady,
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

  return (
    <div className="card !p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-text mb-1">ขั้นตอนการทำงาน (Workflow)</h2>
          <p className="text-sm text-text-muted">ดำเนินการตามขั้นตอนเพื่อส่งมอบงาน</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-dim font-medium uppercase tracking-wider mb-1">Scope Status</p>
          <p className={`text-sm font-bold ${scopeReady ? 'text-success' : (hasNoScope && hasNoBrief) ? 'text-text-dim' : 'text-warning'}`}>
            {(hasNoScope && hasNoBrief) ? 'ยังไม่มี' : scopeReady ? 'พร้อมแล้ว' : 'กำลังดำเนินการ'}
          </p>
        </div>
      </div>

      <div className="relative z-10 px-4">
        <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-surface-3 z-0" />
        <div 
          className="absolute top-8 left-[12.5%] h-0.5 bg-primary z-0 transition-all duration-700 ease-in-out" 
          style={{ width: `${hasNoBrief ? 0 : hasNoScope ? 33 : hasNoQuote ? 66 : 100}%` }} 
        />

        <div className="flex justify-between relative z-10">
          {/* Step 1: Brief */}
          <div className="flex flex-col items-center group w-1/4 relative">
            <button
              onClick={() => {
                if (hasNoBrief && onStartBriefIntake) {
                  onStartBriefIntake(clientId, projectId, projectPath);
                }
              }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
                !hasNoBrief 
                  ? 'bg-success/20 text-success border border-success/30' 
                  : 'bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 cursor-pointer'
              }`}
              disabled={!hasNoBrief}
            >
              {!hasNoBrief ? <CheckCircle className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
            </button>
            <span className={`font-semibold text-sm ${hasNoBrief ? 'text-primary-light' : 'text-text'}`}>1. สร้าง Brief</span>
            <span className="text-xs text-text-dim mt-1 text-center">{!hasNoBrief ? 'เสร็จสิ้น' : 'รวบรวมความต้องการ'}</span>
          </div>

          {/* Step 2: Scope */}
          <div className="flex flex-col items-center group w-1/4 relative">
            <button
              onClick={() => {
                if (!hasNoBrief && hasNoScope) {
                  onCreateDocument(clientId, projectId, projectPath, 'scope');
                }
              }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
                !hasNoScope 
                  ? 'bg-success/20 text-success border border-success/30' 
                  : (!hasNoBrief && hasNoScope) 
                    ? 'bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 cursor-pointer' 
                    : 'bg-surface-2 text-text-dim border border-border cursor-not-allowed'
              }`}
              disabled={hasNoBrief || !hasNoScope}
            >
              {!hasNoScope ? <CheckCircle className="w-7 h-7" /> : <Target className="w-7 h-7" />}
            </button>
            <span className={`font-semibold text-sm ${(!hasNoBrief && hasNoScope) ? 'text-primary-light' : !hasNoScope ? 'text-text' : 'text-text-muted'}`}>2. สร้าง Scope</span>
            <span className="text-xs text-text-dim mt-1 text-center">{!hasNoScope ? 'เสร็จสิ้น' : 'กำหนดขอบเขตงาน'}</span>
          </div>

          {/* Step 3: Quotation */}
          <div className="flex flex-col items-center group w-1/4 relative">
            <button
              onClick={() => {
                if (!hasNoScope && hasNoQuote) {
                  onCreateDocument(clientId, projectId, projectPath, 'quotation');
                }
              }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
                !hasNoQuote 
                  ? 'bg-success/20 text-success border border-success/30' 
                  : (!hasNoScope && hasNoQuote) 
                    ? 'bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 cursor-pointer' 
                    : 'bg-surface-2 text-text-dim border border-border cursor-not-allowed'
              }`}
              disabled={hasNoScope || !hasNoQuote}
            >
              {!hasNoQuote ? <CheckCircle className="w-7 h-7" /> : <Briefcase className="w-7 h-7" />}
            </button>
            <span className={`font-semibold text-sm ${(!hasNoScope && hasNoQuote) ? 'text-primary-light' : !hasNoQuote ? 'text-text' : 'text-text-muted'}`}>3. เสนอราคา</span>
            <span className="text-xs text-text-dim mt-1 text-center">{!hasNoQuote ? 'เสร็จสิ้น' : 'ออกใบเสนอราคา'}</span>
          </div>

          {/* Step 4: Review */}
          <div className="flex flex-col items-center group w-1/4 relative">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
                approvedDocs >= 2 
                  ? 'bg-success/20 text-success border border-success/30' 
                  : (!hasNoQuote && approvedDocs < 2) 
                    ? 'bg-warning/20 text-warning border-2 border-warning ring-4 ring-warning/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                    : 'bg-surface-2 text-text-dim border border-border'
              }`}
            >
              {approvedDocs >= 2 ? <CheckCircle className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <span className={`font-semibold text-sm ${(!hasNoQuote && approvedDocs < 2) ? 'text-warning' : approvedDocs >= 2 ? 'text-text' : 'text-text-muted'}`}>4. อนุมัติ</span>
            <span className="text-xs text-text-dim mt-1 text-center">{approvedDocs >= 2 ? 'อนุมัติครบถ้วน' : 'รอการอนุมัติ'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
