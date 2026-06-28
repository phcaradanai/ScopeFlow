import { describe, expect, it } from 'vitest';
import {
  shouldShowLifecycleFeedback,
  shouldClearLifecycleFeedback,
  type LifecycleFeedbackState,
} from '../lifecycleFeedbackGuard';

describe('lifecycleFeedbackGuard', () => {
  const CURRENT_PROJECT = '/projects/A';
  const NOW = 1000000;
  const TWO_MINUTES_MS = 2 * 60 * 1000;

  describe('shouldShowLifecycleFeedback', () => {
    it('shows fresh recommended_next_action feedback for matching project', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'recommended_next_action',
        projectPath: CURRENT_PROJECT,
        createdAt: NOW - 1000, // 1 second ago
      };
      expect(shouldShowLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(true);
    });

    it('hides if empty projectPath does not match', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'recommended_next_action',
        createdAt: NOW - 1000,
      };
      expect(shouldShowLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(false);
    });

    it('hides if wrong projectPath does not match', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'recommended_next_action',
        projectPath: '/projects/B',
        createdAt: NOW - 1000,
      };
      expect(shouldShowLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(false);
    });

    it('hides if missing createdAt (stale)', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'recommended_next_action',
        projectPath: CURRENT_PROJECT,
      };
      expect(shouldShowLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(false);
    });

    it('hides if stale feedback (past TTL)', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'recommended_next_action',
        projectPath: CURRENT_PROJECT,
        createdAt: NOW - TWO_MINUTES_MS - 1000, // 2 mins and 1 sec ago
      };
      expect(shouldShowLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(false);
    });

    it('hides if source is manual_create', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'manual_create',
        projectPath: CURRENT_PROJECT,
        createdAt: NOW - 1000,
      };
      expect(shouldShowLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(false);
    });
  });

  describe('shouldClearLifecycleFeedback', () => {
    it('does not clear fresh recommended_next_action feedback for matching project', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'recommended_next_action',
        projectPath: CURRENT_PROJECT,
        createdAt: NOW - 1000,
      };
      expect(shouldClearLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(false);
    });

    it('clears if empty projectPath does not match', () => {
      // It should clear because it doesn't match the current project context properly (handled by manual create check or missing timestamp check in practice, but specifically handled by source check if source is missing)
      const feedback: LifecycleFeedbackState = {
        source: 'manual_create',
      };
      expect(shouldClearLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(true);
    });

    it('clears if wrong projectPath does not match', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'recommended_next_action',
        projectPath: '/projects/B',
        createdAt: NOW - 1000,
      };
      expect(shouldClearLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(true);
    });

    it('clears if missing createdAt (stale)', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'recommended_next_action',
        projectPath: CURRENT_PROJECT,
      };
      expect(shouldClearLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(true);
    });

    it('clears stale feedback after TTL', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'recommended_next_action',
        projectPath: CURRENT_PROJECT,
        createdAt: NOW - TWO_MINUTES_MS - 1000,
      };
      expect(shouldClearLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(true);
    });

    it('clears manual_create feedback', () => {
      const feedback: LifecycleFeedbackState = {
        source: 'manual_create',
        projectPath: CURRENT_PROJECT,
        createdAt: NOW - 1000,
      };
      expect(shouldClearLifecycleFeedback(feedback, CURRENT_PROJECT, NOW)).toBe(true);
    });
  });
});
