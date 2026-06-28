export interface LifecycleFeedbackCandidate {
  source?: string;
  projectPath?: string;
  createdAt?: number;
}

export const LIFECYCLE_FEEDBACK_TTL_MS = 2 * 60 * 1000;

export function isLifecycleFeedbackStale(feedback: LifecycleFeedbackCandidate | null | undefined, now: number = Date.now()): boolean {
  if (!feedback?.createdAt) return true;
  return now - feedback.createdAt > LIFECYCLE_FEEDBACK_TTL_MS;
}

export function doesLifecycleFeedbackBelongToProject(feedback: LifecycleFeedbackCandidate | null | undefined, projectPath: string): boolean {
  return Boolean(feedback?.projectPath && feedback.projectPath === projectPath);
}

export function shouldShowLifecycleFeedback(feedback: LifecycleFeedbackCandidate | null | undefined, projectPath: string, now: number = Date.now()): boolean {
  return Boolean(
    feedback?.source === 'recommended_next_action' &&
    doesLifecycleFeedbackBelongToProject(feedback, projectPath) &&
    !isLifecycleFeedbackStale(feedback, now)
  );
}

export function shouldClearLifecycleFeedback(feedback: LifecycleFeedbackCandidate | null | undefined, projectPath: string, now: number = Date.now()): boolean {
  if (!feedback) return false;
  return feedback.source !== 'recommended_next_action' || !doesLifecycleFeedbackBelongToProject(feedback, projectPath) || isLifecycleFeedbackStale(feedback, now);
}
