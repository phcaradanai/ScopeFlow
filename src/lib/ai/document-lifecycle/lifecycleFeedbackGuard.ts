export interface LifecycleFeedbackState {
  source?: string;
  projectPath?: string;
  createdAt?: number;
  [key: string]: any;
}

export function shouldShowLifecycleFeedback(
  feedback: LifecycleFeedbackState | null | undefined,
  currentProjectPath: string,
  now: number
): boolean {
  if (!feedback) return false;
  if (feedback.source !== 'recommended_next_action') return false;
  if (!feedback.projectPath || feedback.projectPath !== currentProjectPath) return false;
  
  if (!feedback.createdAt) return false;
  
  const isStale = (now - feedback.createdAt) > 2 * 60 * 1000;
  return !isStale;
}

export function shouldClearLifecycleFeedback(
  feedback: LifecycleFeedbackState | null | undefined,
  currentProjectPath: string,
  now: number
): boolean {
  if (!feedback) return false;
  
  // Always clear if it belongs to a different project
  if (feedback.projectPath && feedback.projectPath !== currentProjectPath) return true;
  
  // Clear if not from recommended_next_action (e.g. manual create)
  if (feedback.source !== 'recommended_next_action') return true;
  
  // Clear if stale or missing timestamp
  if (!feedback.createdAt) return true;
  
  const isStale = (now - feedback.createdAt) > 2 * 60 * 1000;
  return isStale;
}
