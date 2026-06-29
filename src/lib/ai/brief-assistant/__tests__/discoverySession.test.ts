import { describe, expect, it } from 'vitest';
import { answerDiscoveryQuestion, createDiscoverySession, refreshDiscoveryReadiness } from '../discoverySession';

describe('discoverySession', () => {
  it('starts as collecting and exposes the next best question as the next action', () => {
    const session = createDiscoverySession({
      clientId: 'client-a',
      projectType: 'อื่น ๆ',
      rawRequest: 'อยากทำระบบให้ร้านหน่อย',
      now: '2026-01-01T00:00:00.000Z',
    });

    expect(session.status).toBe('collecting');
    expect(session.canGenerateBrief).toBe(false);
    expect(session.nextActionLabel).toContain('ฟีเจอร์ที่จำเป็นต้องมี');
    expect(session.updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('updates readiness and action flags as customer answers are captured', () => {
    let session = createDiscoverySession({
      clientId: 'client-a',
      projectId: 'project-a',
      projectType: 'เว็บขายของ',
      rawRequest: 'ต้องการเว็บขายของสำหรับขายสินค้าออนไลน์',
      now: '2026-01-01T00:00:00.000Z',
    });

    session = answerDiscoveryQuestion(session, 'ผู้ใช้งานมี admin และลูกค้าสมาชิก', '2026-01-01T00:01:00.000Z');
    session = answerDiscoveryQuestion(session, 'ฟีเจอร์หลักคือสินค้า ตะกร้า checkout สต็อก และรายงานยอดขาย', '2026-01-01T00:02:00.000Z');
    session = answerDiscoveryQuestion(session, 'ใช้งานบน web browser ก่อน mobile app ยังไม่รวม', '2026-01-01T00:03:00.000Z');
    session = answerDiscoveryQuestion(session, 'ข้อมูลสินค้าเริ่มต้นมาจาก excel และรูปภาพลูกค้าเตรียมให้', '2026-01-01T00:04:00.000Z');
    session = answerDiscoveryQuestion(session, 'เชื่อม payment พร้อมเพย์และส่ง email แจ้งเตือน', '2026-01-01T00:05:00.000Z');

    expect(session.canGenerateBrief).toBe(true);
    expect(session.canGenerateScope).toBe(true);
    expect(session.canGenerateQuotation).toBe(false);
    expect(session.status).toBe('ready_for_scope');
    expect(session.nextActionLabel).toBe('Generate Brief and Scope Draft');
    expect(session.updatedAt).toBe('2026-01-01T00:05:00.000Z');
  });

  it('refreshes readiness with a new digest while preserving session identity', () => {
    const session = createDiscoverySession({
      id: 'session-1',
      clientId: 'client-a',
      rawRequest: 'อยากทำระบบหลังบ้าน',
      now: '2026-01-01T00:00:00.000Z',
    });

    const refreshed = refreshDiscoveryReadiness(session, undefined, '2026-01-01T00:10:00.000Z');

    expect(refreshed.id).toBe('session-1');
    expect(refreshed.updatedAt).toBe('2026-01-01T00:10:00.000Z');
    expect(refreshed.conversation.consolidatedRequest).toBe(session.conversation.consolidatedRequest);
  });
});
