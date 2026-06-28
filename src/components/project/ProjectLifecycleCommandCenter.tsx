import { useState, useEffect } from 'react';
import { ExternalLink, LockKeyhole, AlertTriangle, CheckCircle2, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { type LifecycleScanFile, scanDocumentLifecycleFromFiles } from '../../lib/ai/document-lifecycle/documentLifecycleFileScan';
import { buildDocumentLifecycleSummary } from '../../lib/ai/document-lifecycle/documentLifecycle';
import { getDocumentLifecycleActionTarget } from '../../lib/ai/document-lifecycle/documentLifecycleAction';
import { getLifecycleCommandAction } from '../../lib/ai/document-lifecycle/documentLifecycleCommandAction';
import { getCloseoutReopenRequestSummary } from '../../lib/ai/closeout/closeoutReopenDetection';
import { getLatestCloseoutReopenDecisionSummary } from '../../lib/ai/closeout/closeoutReopenDecisionDetection';
import { getCloseoutReopenNextAction } from '../../lib/ai/closeout/closeoutReopenNextAction';
import { getCloseoutReopenActionTarget } from '../../lib/ai/closeout/closeoutReopenActionTarget';
import { getProjectLifecyclePriority } from '../../lib/ai/document-lifecycle/documentLifecyclePriority';
import { buildLifecycleExplanation } from '../../lib/ai/document-lifecycle/lifecycleExplanation';
import DocumentCreationPreviewModal from './DocumentCreationPreviewModal';

interface ProjectLifecycleCommandCenterProps {
  projectName?: string;
  projectPath: string;
  scanFiles: LifecycleScanFile[];
  onOpenDocument: (path: string) => void;
  onOpenProject?: () => void;
  onStartBriefIntake?: () => void;
  onCreateDocument?: (initialType?: string, lifecycleContext?: any) => void;
  lifecycleFeedback?: any;
  onClearLifecycleFeedback?: () => void;
}

export default function ProjectLifecycleCommandCenter({ projectName, projectPath, scanFiles, onOpenDocument, onOpenProject, onStartBriefIntake, onCreateDocument, lifecycleFeedback, onClearLifecycleFeedback }: ProjectLifecycleCommandCenterProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const lifecycleInput = scanDocumentLifecycleFromFiles(scanFiles);
  const summary = buildDocumentLifecycleSummary(lifecycleInput);
  const actionTarget = getDocumentLifecycleActionTarget(scanFiles, lifecycleInput);
  const priority = getProjectLifecyclePriority(summary, scanFiles);

  const reopenSummary = getCloseoutReopenRequestSummary(scanFiles);
  const reopenDecisionSummary = getLatestCloseoutReopenDecisionSummary(scanFiles);
  const displayNextAction = getCloseoutReopenNextAction(reopenDecisionSummary, summary.next_action);
  const displayActionTarget = getCloseoutReopenActionTarget(actionTarget, reopenSummary, reopenDecisionSummary);
  const commandAction = getLifecycleCommandAction(displayActionTarget, lifecycleInput);
  const explanation = buildLifecycleExplanation(lifecycleInput, summary, scanFiles, displayActionTarget);
  const feedbackBelongsToProject = !lifecycleFeedback?.projectPath || lifecycleFeedback.projectPath === projectPath;
  
  const [isFeedbackStale, setIsFeedbackStale] = useState(false);
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);

  useEffect(() => {
    if (!lifecycleFeedback) {
      setIsFeedbackStale(false);
      return;
    }
    if (lifecycleFeedback.createdAt) {
      const isStale = Date.now() - lifecycleFeedback.createdAt > 2 * 60 * 1000;
      setIsFeedbackStale(isStale);
      
      // Auto-clear after 2 minutes if it's not already stale
      if (!isStale) {
        const timeout = setTimeout(() => {
          setIsFeedbackStale(true);
        }, (lifecycleFeedback.createdAt + 2 * 60 * 1000) - Date.now());
        return () => clearTimeout(timeout);
      }
    }
  }, [lifecycleFeedback]);

  const showFeedback = lifecycleFeedback && feedbackBelongsToProject && !isFeedbackStale && lifecycleFeedback.source === 'recommended_next_action';

  useEffect(() => {
    if (lifecycleFeedback && onClearLifecycleFeedback) {
      if (!feedbackBelongsToProject || isFeedbackStale) {
        onClearLifecycleFeedback();
      }
    }
  }, [lifecycleFeedback, feedbackBelongsToProject, isFeedbackStale, onClearLifecycleFeedback]);

  const firstBlocked = summary.items.find(doc => doc.status === 'blocked');

  const handleActionClick = () => {
    if (commandAction.kind === 'open_document' && commandAction.file_path) {
      onOpenDocument(commandAction.file_path);
      return;
    }
    if (commandAction.kind === 'start_brief_intake' && onStartBriefIntake) {
      onStartBriefIntake();
      return;
    }
    if (commandAction.kind === 'create_document' && onCreateDocument) {
      setShowPreviewModal(true);
      return;
    }
    onOpenProject?.();
  };

  const handleConfirmCreate = () => {
    setShowPreviewModal(false);
    if (onCreateDocument) {
      onCreateDocument(commandAction.initial_type, {
        source: 'recommended_next_action',
        initialType: commandAction.initial_type || 'document',
        reason: commandAction.guidance,
        projectPath,
        recommendationWhy: displayNextAction,
      });
    }
  };

  return (
    <>
      {showFeedback && (
        <div className="mb-4 rounded-xl border border-success/30 bg-success/10 p-4 shadow-sm relative animate-in fade-in slide-in-from-top-2 duration-300">
          <button onClick={onClearLifecycleFeedback} className="absolute top-2 right-2 p-1 text-success/60 hover:text-success transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-success mb-1">
                สร้างเอกสาร {lifecycleFeedback.initialType || 'ใหม่'} สำเร็จแล้ว!
              </p>
              <p className="text-xs text-text-muted leading-relaxed mb-2">
                คุณเพิ่งสร้างเอกสารสำหรับ <span className="font-semibold text-text">{lifecycleFeedback.reason}</span>
              </p>
              {lifecycleFeedback.recommendationWhy && (
                <div className="rounded border border-success/20 bg-success/5 p-2 mt-2">
                  <p className="text-[11px] text-text-muted">
                    <span className="font-bold text-success">Next step:</span> {lifecycleFeedback.recommendationWhy}
                  </p>
                </div>
              )}
              {lifecycleFeedback.createdFilePath && (
                <button
                  type="button"
                  onClick={() => onOpenDocument(lifecycleFeedback.createdFilePath)}
                  className="mt-3 flex items-center gap-2 text-xs font-bold text-success hover:text-success-light transition-colors bg-success/10 hover:bg-success/20 py-1.5 px-3 rounded-md"
                >
                  <FileText className="w-3.5 h-3.5" />
                  เปิดไฟล์ที่สร้าง
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 relative">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-accent" />
      <div className="p-5 pl-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <LockKeyhole className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Recommended Next Action</h3>
            {firstBlocked && (
              <span className="badge text-[10px] bg-error/10 text-error border-error/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Blocked
              </span>
            )}
            <span className={`badge text-[10px] border ${priority.category === 'blocked' ? 'bg-error/10 text-error border-error/20' : priority.category === 'missing_docs' ? 'bg-warning/10 text-warning border-warning/20' : priority.category === 'can_close' ? 'bg-success/10 text-success border-success/20' : 'bg-surface-2 text-text-muted border-border'}`}>
              {priority.label}
            </span>
          </div>
          
          <h4 className="text-base font-bold text-text mb-1">{commandAction.guidance}</h4>
          <p className="text-sm text-text-muted leading-relaxed mb-2">
            <span className="font-bold text-primary-light">Why:</span> {displayNextAction}
          </p>

          <div className="border border-border/50 rounded-lg overflow-hidden bg-surface mb-3 text-[13px]">
            <button 
              type="button"
              onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
              className="w-full flex items-center justify-between p-2.5 bg-surface-2 hover:bg-surface-3 transition-colors text-text-muted font-medium"
            >
              <div className="flex items-center gap-2">
                <span className="text-primary">Why this action?</span>
                <span className="text-text-dim truncate max-w-[200px] md:max-w-md">{explanation.headline}</span>
              </div>
              {isExplanationExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isExplanationExpanded && (
              <div className="p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {explanation.evidence.length > 0 && (
                  <div>
                    <h5 className="font-bold text-text-muted mb-1 text-[11px] uppercase tracking-wider">Evidence</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {explanation.evidence.map((e, i) => (
                        e.sourcePath ? (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onOpenDocument(e.sourcePath!)}
                            className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] border border-success/20 flex items-center gap-1 hover:bg-success/20 transition-colors cursor-pointer"
                            title={e.actionLabel}
                          >
                            <FileText className="w-3 h-3" />
                            {e.label}
                          </button>
                        ) : (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] border border-success/20">
                            {e.label}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}
                {explanation.missingDocuments.length > 0 && (
                  <div>
                    <h5 className="font-bold text-text-muted mb-1 text-[11px] uppercase tracking-wider">Missing</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {explanation.missingDocuments.map((e, i) => (
                        e.sourcePath ? (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onOpenDocument(e.sourcePath!)}
                            className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[11px] border border-warning/20 flex items-center gap-1 hover:bg-warning/20 transition-colors cursor-pointer"
                            title={e.actionLabel}
                          >
                            <FileText className="w-3 h-3" />
                            {e.label}
                          </button>
                        ) : (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[11px] border border-warning/20">
                            {e.label}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {explanation.riskIfIgnored && (
                    <div className="bg-error/5 border border-error/10 p-2.5 rounded-md">
                      <h5 className="font-bold text-error mb-1 text-[11px] uppercase tracking-wider">Risk If Ignored</h5>
                      <p className="text-text-muted leading-relaxed">{explanation.riskIfIgnored.label}</p>
                    </div>
                  )}
                  {explanation.expectedNextState && (
                    <div className="bg-primary/5 border border-primary/10 p-2.5 rounded-md">
                      <h5 className="font-bold text-primary mb-1 text-[11px] uppercase tracking-wider">Expected Outcome</h5>
                      <p className="text-text-muted leading-relaxed">{explanation.expectedNextState.label}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {firstBlocked && (
            <p className="text-[11px] text-error mt-2 leading-relaxed flex items-start gap-1">
              <span className="font-bold">Blocker:</span> {firstBlocked.label} - {firstBlocked.recommended_next_action}
            </p>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-stretch gap-2">
          <button 
            type="button" 
            onClick={handleActionClick}
            className="btn btn-primary shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 py-2.5 px-6 group"
          >
            <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
            {commandAction.label}
          </button>
          {commandAction.kind !== 'open_document' && (
            <p className="text-[10px] text-text-dim text-center max-w-[220px]">ถ้า action นี้เปิด modal ไม่ได้ ระบบจะพากลับมาที่ Project Overview แทน</p>
          )}
        </div>

      </div>
    </div>

    <DocumentCreationPreviewModal
      isOpen={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      onConfirm={handleConfirmCreate}
      documentType={commandAction.initial_type}
      projectName={projectName || 'Current Project'}
      reason={commandAction.guidance}
      lifecycleStage={priority.label}
      recommendationWhy={displayNextAction}
    />
    </>
  );
}
