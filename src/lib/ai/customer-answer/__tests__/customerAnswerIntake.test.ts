import { describe, expect, it } from 'vitest';
import { classifyCustomerAnswer } from '../customerAnswerIntake';

describe('classifyCustomerAnswer', () => {
  it('classifies approval answers', () => {
    const result = classifyCustomerAnswer('โอเค อนุมัติ quotation นี้ confirm ให้เริ่มงานได้');

    expect(result.intent).toBe('approval');
    expect(result.confidence).toBe('high');
    expect(result.shouldCreateChangeRequest).toBe(false);
    expect(result.shouldAskFollowUp).toBe(false);
    expect(result.riskLevel).toBe('low');
  });

  it('classifies rejection answers', () => {
    const result = classifyCustomerAnswer('ยังไม่ผ่านครับ ไม่อนุมัติราคา ขอปรับใหม่');

    expect(result.intent).toBe('rejection');
    expect(result.shouldCreateChangeRequest).toBe(false);
    expect(result.shouldAskFollowUp).toBe(true);
    expect(result.riskLevel).toBe('medium');
  });

  it('classifies clarification questions', () => {
    const result = classifyCustomerAnswer('ขอถามเพิ่มครับ scope นี้หมายถึงรวม deploy ด้วยไหม?');

    expect(result.intent).toBe('clarification');
    expect(result.shouldCreateChangeRequest).toBe(false);
    expect(result.shouldAskFollowUp).toBe(true);
  });

  it('classifies scope change requests as needing CR/DCR review', () => {
    const result = classifyCustomerAnswer('ขอเพิ่มอีกนิดได้ไหม เปลี่ยน flow login และแก้ dashboard ด้วย');

    expect(result.intent).toBe('scope_change');
    expect(result.shouldCreateChangeRequest).toBe(true);
    expect(result.riskLevel).toBe('high');
    expect(result.recommendedAction).toContain('CR/DCR');
  });

  it('classifies new requirements as needing CR/DCR review', () => {
    const result = classifyCustomerAnswer('อยากได้ feature ใหม่ เพิ่มระบบ export report อีก module');

    expect(result.intent).toBe('new_requirement');
    expect(result.confidence).toBe('high');
    expect(result.shouldCreateChangeRequest).toBe(true);
    expect(result.riskLevel).toBe('high');
  });

  it('treats empty answers as unknown and asks follow-up', () => {
    const result = classifyCustomerAnswer('   ');

    expect(result.intent).toBe('unknown');
    expect(result.confidence).toBe('low');
    expect(result.shouldAskFollowUp).toBe(true);
  });

  it('does not treat plain unknown answers as approval', () => {
    const result = classifyCustomerAnswer('เดี๋ยวดูอีกทีครับ');

    expect(result.intent).toBe('unknown');
    expect(result.shouldCreateChangeRequest).toBe(false);
    expect(result.shouldAskFollowUp).toBe(true);
  });
});
