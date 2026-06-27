import { describe, expect, it } from 'vitest';
import { getProjectLifecycleEmptyGuidance } from '../documentLifecycleEmptyGuidance';

describe('documentLifecycleEmptyGuidance', () => {
  it('explains empty blocked filter as a healthy state', () => {
    const guidance = getProjectLifecycleEmptyGuidance('blocked');

    expect(guidance.title).toContain('ไม่มี blocker');
    expect(guidance.recommended_next_action).toContain('Missing Docs');
  });

  it('explains empty can close filter as no signed-off project yet', () => {
    const guidance = getProjectLifecycleEmptyGuidance('can_close');

    expect(guidance.title).toContain('พร้อมปิดงาน');
    expect(guidance.description).toContain('sign-off');
  });

  it('explains empty closeout ready filter as needing closeout pack first', () => {
    const guidance = getProjectLifecycleEmptyGuidance('closeout_ready');

    expect(guidance.title).toContain('Closeout Pack');
    expect(guidance.recommended_next_action).toContain('Can Close');
  });

  it('explains empty export ready filter as needing export index', () => {
    const guidance = getProjectLifecycleEmptyGuidance('export_ready');

    expect(guidance.title).toContain('พร้อมส่งต่อ');
    expect(guidance.recommended_next_action).toContain('Export Index');
  });

  it('explains empty all filter as no lifecycle project scanned', () => {
    const guidance = getProjectLifecycleEmptyGuidance('all');

    expect(guidance.title).toContain('ยังไม่มี project');
    expect(guidance.recommended_next_action).toContain('brief');
  });
});
