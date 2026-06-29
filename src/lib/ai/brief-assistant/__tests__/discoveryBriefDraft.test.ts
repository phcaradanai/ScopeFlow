import { describe, expect, it } from 'vitest';
import { answerDiscoveryQuestion, createDiscoverySession } from '../discoverySession';
import { buildDiscoveryBriefMarkdown, buildDiscoveryDigest } from '../discoveryBriefDraft';

describe('discoveryBriefDraft', () => {
  it('builds a scope digest from a discovery session conversation', () => {
    let session = createDiscoverySession({
      id: 'session-1',
      clientId: 'client-a',
      projectId: 'project-a',
      projectType: 'เว็บขายของ',
      rawRequest: 'ต้องการเว็บขายของสำหรับขายสินค้าออนไลน์',
    });

    session = answerDiscoveryQuestion(session, 'ผู้ใช้งานมี admin และลูกค้าสมาชิก');
    session = answerDiscoveryQuestion(session, 'ฟีเจอร์หลักคือสินค้า ตะกร้า checkout สต็อก และรายงานยอดขาย');

    const digest = buildDiscoveryDigest(session);

    expect(digest.detected_project_type).toBe('เว็บขายของ');
    expect(digest.confirmed_facts).toContain('ผู้ใช้งานมี admin และลูกค้าสมาชิก');
    expect(digest.confirmed_facts).toContain('ฟีเจอร์หลักคือสินค้า ตะกร้า checkout สต็อก และรายงานยอดขาย');
    expect(digest.suggested_next_documents).toContain('Brief');
  });

  it('generates a brief markdown draft from discovery session data', () => {
    let session = createDiscoverySession({
      id: 'session-1',
      clientId: 'client-a',
      projectId: 'project-a',
      projectType: 'เว็บขายของ',
      rawRequest: 'ต้องการเว็บขายของสำหรับขายสินค้าออนไลน์',
    });

    session = answerDiscoveryQuestion(session, 'ผู้ใช้งานมี admin และลูกค้าสมาชิก');
    session = answerDiscoveryQuestion(session, 'ฟีเจอร์หลักคือสินค้า ตะกร้า checkout สต็อก และรายงานยอดขาย');

    const markdown = buildDiscoveryBriefMarkdown(session, 'client-a', 'project-a');

    expect(markdown).toContain('type: brief');
    expect(markdown).toContain('# ร่างความต้องการ: project-a');
    expect(markdown).toContain('ข้อมูลเพิ่มเติมจาก conversation');
    expect(markdown).toContain('ผู้ใช้งานมี admin และลูกค้าสมาชิก');
    expect(markdown).toContain('ฟีเจอร์หลักคือสินค้า ตะกร้า checkout สต็อก และรายงานยอดขาย');
  });
});
