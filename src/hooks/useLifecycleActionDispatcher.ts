import { useState, useCallback, useMemo } from 'react';
import { type LifecycleScanFile, scanDocumentLifecycleFromFiles } from '../lib/ai/document-lifecycle/documentLifecycleFileScan';
import { buildDocumentLifecycleSummary } from '../lib/ai/document-lifecycle/documentLifecycle';
import { getDocumentLifecycleActionTarget } from '../lib/ai/document-lifecycle/documentLifecycleAction';
import { getLifecycleCommandAction } from '../lib/ai/document-lifecycle/documentLifecycleCommandAction';
import { getCloseoutReopenRequestSummary } from '../lib/ai/closeout/closeoutReopenDetection';
import { getLatestCloseoutReopenDecisionSummary } from '../lib/ai/closeout/closeoutReopenDecisionDetection';
import { getCloseoutReopenNextAction } from '../lib/ai/closeout/closeoutReopenNextAction';
import { getCloseoutReopenActionTarget } from '../lib/ai/closeout/closeoutReopenActionTarget';
import { getProjectLifecyclePriority } from '../lib/ai/document-lifecycle/documentLifecyclePriority';
import { buildLifecycleExplanation } from '../lib/ai/document-lifecycle/lifecycleExplanation';

export interface UseLifecycleActionDispatcherProps {
  scanFiles: LifecycleScanFile[];
  projectPath: string;
  onOpenDocument: (path: string) => void;
  onOpenProject?: () => void;
  onStartBriefIntake?: () => void;
  onCreateDocument?: (initialType?: string, lifecycleContext?: any) => void;
}

export function useLifecycleActionDispatcher({
  scanFiles,
  projectPath,
  onOpenDocument,
  onOpenProject,
  onStartBriefIntake,
  onCreateDocument,
}: UseLifecycleActionDispatcherProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const {
    lifecycleInput,
    summary,
    priority,
    displayNextAction,
    displayActionTarget,
    commandAction,
    explanation
  } = useMemo(() => {
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

    return {
      lifecycleInput,
      summary,
      priority,
      displayNextAction,
      displayActionTarget,
      commandAction,
      explanation
    };
  }, [scanFiles]);

  const executeAction = useCallback((requirePreview = true) => {
    if (commandAction.kind === 'open_document' && commandAction.file_path) {
      onOpenDocument(commandAction.file_path);
      return;
    }
    if (commandAction.kind === 'start_brief_intake' && onStartBriefIntake) {
      onStartBriefIntake();
      return;
    }
    if (commandAction.kind === 'create_document' && onCreateDocument) {
      if (requirePreview) {
        setShowPreviewModal(true);
      } else {
        onCreateDocument(commandAction.initial_type, {
          source: 'recommended_next_action',
          initialType: commandAction.initial_type || 'document',
          reason: commandAction.guidance,
          projectPath,
          recommendationWhy: displayNextAction,
        });
      }
      return;
    }
    onOpenProject?.();
  }, [commandAction, onOpenDocument, onStartBriefIntake, onCreateDocument, onOpenProject, projectPath, displayNextAction]);

  const confirmCreateDocument = useCallback(() => {
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
  }, [commandAction, onCreateDocument, projectPath, displayNextAction]);

  return {
    showPreviewModal,
    setShowPreviewModal,
    lifecycleInput,
    summary,
    priority,
    displayNextAction,
    displayActionTarget,
    commandAction,
    explanation,
    executeAction,
    confirmCreateDocument,
  };
}
