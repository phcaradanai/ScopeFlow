import { describe, expect, it } from 'vitest';
import { appendBriefConversationAnswer, buildBriefConversationState } from '../briefConversationLoop';

describe('briefConversationLoop', () => {
  it('starts in collecting mode for vague requests and asks the highest-value missing question', () => {
    const state = buildBriefConversationState({
      rawRequest: 'อยากทำระบบให้ร้านหน่อย',
      projectType: 'อื่น ๆ',
    });

    expect(state.status).toBe('collecting');
    expect(state.readiness.level).toBe('not_ready');
    expect(state.nextQuestion?.signalId).toBe('features');
    expect(state.nextQuestion?.question).toContain('ฟีเจอร์ที่จำเป็นต้องมี');
  });

  it('appends customer answers and consolidates them into the next readiness pass', () => {
    const initial = buildBriefConversationState({
      rawRequest: 'อยากทำระบบให้ร้านหน่อย',
      projectType: 'อื่น ๆ',
    });

    const afterUsers = appendBriefConversationAnswer(
      initial,
      'มี admin ร้านค้าและลูกค้าทั่วไป ลูกค้าต้องสมัครสมาชิกและสั่งซื้อสินค้าได้'
    );

    expect(afterUsers.turns).toHaveLength(1);
    expect(afterUsers.consolidatedRequest).toContain('admin ร้านค้า');
    expect(afterUsers.readiness.signals.find(signal => signal.id === 'users')?.present).toBe(true);
    expect(afterUsers.readiness.signals.find(signal => signal.id === 'features')?.present).toBe(true);
  });

  it('moves toward scope readiness as answers fill core missing signals', () => {
    let state = buildBriefConversationState({
      rawRequest: 'ต้องการเว็บขายของสำหรับขายสินค้าออนไลน์',
      projectType: 'เว็บขายของ',
    });

    state = appendBriefConversationAnswer(state, 'ผู้ใช้งานมี admin และลูกค้าสมาชิก');
    state = appendBriefConversationAnswer(state, 'ฟีเจอร์หลักคือสินค้า ตะกร้า checkout สต็อก และรายงานยอดขาย');
    state = appendBriefConversationAnswer(state, 'ใช้งานบน web browser ก่อน mobile app ยังไม่รวม');
    state = appendBriefConversationAnswer(state, 'ข้อมูลสินค้าเริ่มต้นมาจาก excel และรูปภาพลูกค้าเตรียมให้');
    state = appendBriefConversationAnswer(state, 'เชื่อม payment พร้อมเพย์และส่ง email แจ้งเตือน');

    expect(['brief_ready', 'scope_ready', 'quotation_ready']).toContain(state.status);
    expect(state.readiness.canCreateBriefDraft).toBe(true);
    expect(state.readiness.shouldCreateScopeDraft).toBe(true);
    expect(state.readiness.shouldCreateQuotation).toBe(false);
  });
});
