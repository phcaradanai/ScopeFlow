import { describe, expect, it } from 'vitest';
import type { ScopeBaselineFromQuote } from '../../scope-baseline/scopeBaselineFromQuote';
import { detectChangeRequest } from '../changeRequestDetection';
import { buildChangeRequestDetectionMarkdown, injectChangeRequestDetectionMarkdown } from '../changeRequestMarkdown';

const baseline: ScopeBaselineFromQuote = {
  status: 'baseline_ready',
  source_quotation_path: 'baseline/quotation-draft-v1.0.md',
  source_scope_path: 'baseline/scope-v1.0.md',
  locked_total: 100000,
  locked_currency: 'THB',
  locked_payment_terms: '50% deposit / 50% before delivery',
  locked_pricing_model: 'fixed_price',
  locked_assumptions: ['ลูกค้ามี merchant account พร้อมใช้งาน'],
  locked_exclusions: ['ไม่รวม mobile app', 'ไม่รวมการเชื่อมต่อ ERP ภายนอก'],
  locked_acceptance_criteria: ['checkout สำเร็จด้วย payment gateway ที่ตกลงไว้'],
  change_request_triggers: ['เพิ่ม payment gateway ใหม่หลังอนุมัติถือเป็น CR', 'เพิ่มรายงาน dashboard เพิ่มเติมถือเป็น CR'],
  editable_after_approval: ['แก้ typo'],
  locked_after_approval: ['ราคา total และ payment terms', 'acceptance criteria'],
  approval_ref: 'signed quote',
  approved_at: '2026-06-27',
  approver_name: 'Client Owner',
  warnings: [],
  recommended_next_action: 'ใช้ baseline คุม scope',
};

describe('changeRequestDetection', () => {
  it('detects likely change request when request matches exclusion', () => {
    const result = detectChangeRequest({
      new_request: 'ลูกค้าอยากเพิ่ม mobile app สำหรับ iOS และ Android',
      baseline,
    });

    expect(result.decision).toBe('likely_change_request');
    expect(result.is_change_request).toBe(true);
    expect(result.impact).toBe('high');
    expect(result.matched.some(match => match.source === 'exclusion')).toBe(true);
  });

  it('detects likely change request when request matches CR trigger', () => {
    const result = detectChangeRequest({
      new_request: 'ขอเพิ่ม payment gateway ใหม่อีกเจ้า',
      baseline,
    });

    expect(result.decision).toBe('likely_change_request');
    expect(result.matched.some(match => match.source === 'cr_trigger')).toBe(true);
    expect(result.recommended_next_action).toContain('Change Request');
  });

  it('marks unrelated request as in scope candidate', () => {
    const result = detectChangeRequest({
      new_request: 'แก้คำผิดในหน้า checkout',
      baseline,
    });

    expect(result.decision).toBe('in_scope');
    expect(result.is_change_request).toBe(false);
    expect(result.impact).toBe('none');
    expect(result.possible_in_scope_reasons.length).toBeGreaterThan(0);
  });

  it('warns when baseline is not ready', () => {
    const result = detectChangeRequest({
      new_request: 'ขอเพิ่ม report dashboard',
      baseline: { ...baseline, status: 'blocked' },
    });

    expect(result.decision).toBe('needs_review');
    expect(result.warnings).toContain('Scope Baseline ยังไม่พร้อมใช้ตรวจ change request');
  });

  it('builds markdown report', () => {
    const result = detectChangeRequest({
      new_request: 'ขอเพิ่ม payment gateway ใหม่อีกเจ้า',
      baseline,
    });
    const markdown = buildChangeRequestDetectionMarkdown('ขอเพิ่ม payment gateway ใหม่อีกเจ้า', result);

    expect(markdown).toContain('## Change Request Detection');
    expect(markdown).toContain('Is Change Request: **yes**');
    expect(markdown).toContain('เพิ่ม payment gateway ใหม่หลังอนุมัติถือเป็น CR');
  });

  it('injects detection after scope baseline', () => {
    const result = detectChangeRequest({ new_request: 'ขอเพิ่ม payment gateway ใหม่อีกเจ้า', baseline });
    const section = buildChangeRequestDetectionMarkdown('ขอเพิ่ม payment gateway ใหม่อีกเจ้า', result);
    const markdown = '# Quote\n\n<!-- scope-baseline-from-approved-quote:start -->\n## Scope Baseline\n<!-- scope-baseline-from-approved-quote:end -->\n';
    const injected = injectChangeRequestDetectionMarkdown(markdown, section);

    expect(injected.indexOf('## Scope Baseline')).toBeLessThan(injected.indexOf('## Change Request Detection'));
    expect(injected.match(/## Change Request Detection/g)?.length).toBe(1);
  });

  it('replaces existing detection instead of duplicating it', () => {
    const first = buildChangeRequestDetectionMarkdown('request one', detectChangeRequest({ new_request: 'request one', baseline }));
    const second = buildChangeRequestDetectionMarkdown('ขอเพิ่ม mobile app', detectChangeRequest({ new_request: 'ขอเพิ่ม mobile app', baseline }));
    const injected = injectChangeRequestDetectionMarkdown(injectChangeRequestDetectionMarkdown('# Quote', first), second);

    expect(injected.match(/## Change Request Detection/g)?.length).toBe(1);
    expect(injected).toContain('ขอเพิ่ม mobile app');
    expect(injected).not.toContain('request one');
  });
});
