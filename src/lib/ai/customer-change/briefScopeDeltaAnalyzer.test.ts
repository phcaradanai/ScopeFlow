import { describe, it, expect, vi } from 'vitest';
import { analyzeBriefScopeDelta } from './briefScopeDeltaAnalyzer';
import * as aiProviderRouter from '../providers/aiProviderRouter';

vi.mock('../providers/aiProviderRouter', () => ({
  generateJsonWithTrace: vi.fn(),
}));

describe('briefScopeDeltaAnalyzer', () => {
  it('should fall back to deterministic if customer message is empty', async () => {
    const result = await analyzeBriefScopeDelta('workspace', { customerMessage: '   ' });
    expect(result.recommended_action).toBe('no_action');
    expect(result.confidence).toBe('low');
  });

  it('should deterministically suggest follow_up if message is a question (fallback)', async () => {
    // Mock rejection to trigger fallback
    vi.mocked(aiProviderRouter.generateJsonWithTrace).mockRejectedValueOnce(new Error('AI failed'));
    
    const result = await analyzeBriefScopeDelta('workspace', { customerMessage: 'ฟีเจอร์นี้หมายความว่าอะไรครับ?' });
    expect(result.recommended_action).toBe('create_follow_up');
  });

  it('should deterministically suggest change_request if scope is approved and there is a change', async () => {
    vi.mocked(aiProviderRouter.generateJsonWithTrace).mockRejectedValueOnce(new Error('AI failed'));
    
    const result = await analyzeBriefScopeDelta('workspace', { 
      customerMessage: 'ขอเพิ่มระบบแชท',
      scopeStatus: 'approved'
    });
    expect(result.recommended_action).toBe('create_change_request');
  });

  it('should deterministically suggest update_scope if scope is NOT approved and there is a change', async () => {
    vi.mocked(aiProviderRouter.generateJsonWithTrace).mockRejectedValueOnce(new Error('AI failed'));
    
    const result = await analyzeBriefScopeDelta('workspace', { 
      customerMessage: 'ขอเปลี่ยนปุ่มเป็นสีแดง',
      latestScopeMarkdown: 'Some scope'
    });
    expect(result.recommended_action).toBe('update_scope');
  });

  it('should use AI result and apply guardrails to prevent scope overwrite', async () => {
    vi.mocked(aiProviderRouter.generateJsonWithTrace).mockResolvedValueOnce({
      result: JSON.stringify({
        summary_of_customer_change: 'ขอเพิ่มระบบแชท',
        brief_delta: 'เพิ่มความต้องการระบบแชท',
        scope_delta: 'เพิ่มขอบเขตระบบแชทแบบเรียลไทม์',
        quote_impact: 'ราคาเพิ่ม',
        acceptance_impact: 'มีรายการทดสอบระบบแชท',
        missing_questions: ['รองรับกี่คน?'],
        recommended_action: 'update_scope', // AI suggested update_scope
        confidence: 'high'
      }),
      traceId: '123'
    });
    
    const result = await analyzeBriefScopeDelta('workspace', { 
      customerMessage: 'ขอเพิ่มระบบแชท',
      scopeLocked: true // But scope is locked!
    });
    
    // Guardrail should override update_scope to create_change_request
    expect(result.recommended_action).toBe('create_change_request');
    expect(result.guardrail_notes).toContain('ป้องกันการเขียนทับ');
  });

  it('should use AI result exactly if safe', async () => {
    vi.mocked(aiProviderRouter.generateJsonWithTrace).mockResolvedValueOnce({
      result: {
        summary_of_customer_change: 'ส่งข้อมูลเพิ่มเติมตามที่ขอ',
        brief_delta: 'ข้อมูลครบถ้วนขึ้น',
        scope_delta: 'ไม่มีผลกระทบ',
        quote_impact: 'ไม่มีผลกระทบ',
        acceptance_impact: 'ไม่มีผลกระทบ',
        missing_questions: [],
        recommended_action: 'update_brief',
        confidence: 'high'
      },
      traceId: '123'
    });
    
    const result = await analyzeBriefScopeDelta('workspace', { 
      customerMessage: 'ตกลงตามนี้ครับ',
      scopeLocked: true // updating brief is allowed even if scope is locked
    });
    
    expect(result.recommended_action).toBe('update_brief');
  });
});
