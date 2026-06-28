import { describe, expect, it } from 'vitest';
import {
  LIFECYCLE_FEEDBACK_TTL_MS,
  doesLifecycleFeedbackBelongToProject,
  isLifecycleFeedbackStale,
  shouldClearLifecycleFeedback,
  shouldShowLifecycleFeedback,
} from '../lifecycleFeedbackGuard';

const now = 1_000_000;
const projectPath = '/workspace/clients/acme/projects/app';

function feedback(overrides = {}) {
  return {
    source: 'recommended_next_action',
    projectPath,
    createdAt: now,
    ...overrides,
  };
}

describe('lifecycleFeedbackGuard', () => {
  it('shows fresh recommended next action feedback for the current project', () => {
    expect(shouldShowLifecycleFeedback(feedback(), projectPath, now + 1_000)).toBe(true);
  });

  it('does not show feedback without a strict project path match', () => {
    expect(doesLifecycleFeedbackBelongToProject(feedback({ projectPath: '' }), projectPath)).toBe(false);
    expect(shouldShowLifecycleFeedback(feedback({ projectPath: '/other/project' }), projectPath, now)).toBe(false);
  });

  it('treats missing createdAt as stale', () => {
    expect(isLifecycleFeedbackStale(feedback({ createdAt: undefined }), now)).toBe(true);
    expect(shouldShowLifecycleFeedback(feedback({ createdAt: undefined }), projectPath, now)).toBe(false);
  });

  it('expires feedback after the ttl', () => {
    expect(isLifecycleFeedbackStale(feedback(), now + LIFECYCLE_FEEDBACK_TTL_MS)).toBe(false);
    expect(isLifecycleFeedbackStale(feedback(), now + LIFECYCLE_FEEDBACK_TTL_MS + 1)).toBe(true);
  });

  it('clears stale, wrong-project, and non-recommended feedback', () => {
    expect(shouldClearLifecycleFeedback(feedback(), projectPath, now + LIFECYCLE_FEEDBACK_TTL_MS + 1)).toBe(true);
    expect(shouldClearLifecycleFeedback(feedback({ projectPath: '/other/project' }), projectPath, now)).toBe(true);
    expect(shouldClearLifecycleFeedback(feedback({ source: 'manual_create' }), projectPath, now)).toBe(true);
    expect(shouldClearLifecycleFeedback(feedback(), projectPath, now)).toBe(false);
  });
});
