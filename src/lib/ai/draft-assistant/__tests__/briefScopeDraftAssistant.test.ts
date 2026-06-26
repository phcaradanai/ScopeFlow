import { describe, expect, it, vi } from 'vitest';
import {
  buildBriefDraftFromDigest,
  buildBriefScopeDraftPack,
  buildScopeDraftFromDigest,
  type BriefScopeDraftInput,
} from '../briefScopeDraftAssistant';

vi.mock('../../../validation', () => ({
  todayISO: () => '2026-06-26',
}));

const baseInput: BriefScopeDraftInput = {
  rawRequest: 'ลูกค้าอยากทำเว็บบริษัทใหม่ มีหน้า Home, About, Services และ Contact form',
  projectType: 'เว็บไซต์บริษัท',
  projectId: 'website-revamp',
  clientId: 'demo-client',
  projectName: 'ปรับปรุงเว็บไซต์องค์กร',
  digest: {
    detected_project_type: 'เว็บไซต์บริษัท',
    confidence: 'high',
    understanding: ['ลูกค้าต้องการเว็บไซต์บริษัทใหม่', 'ต้องมีหน้าหลักและฟอร์มติดต่อ'],
    confirmed_facts: ['มีหน้า Home', 'มีหน้า About', 'มีหน้า Services', 'มี Contact form'],
    assumptions: ['ลูกค้าอาจต้องการ responsive design'],
    unclear_points: ['ยังไม่ชัดว่าใครเตรียมเนื้อหาและรูปภาพ'],
    questions_to_ask: ['ใครเป็นคนเตรียมรูปภาพและข้อความ', 'ต้องการสองภาษาหรือไม่'],
    likely_in_scope: ['ออกแบบหน้า Home', 'ทำฟอร์ม Contact'],
    likely_out_of_scope: ['ไม่รวมค่า domain/hosting ถ้าไม่ระบุ', 'ไม่รวม copywriting'],
    scope_creep_risks: ['ลูกค้าอาจขอแก้ดีไซน์หลายรอบโดยไม่จำกัด'],
    suggested_next_documents: ['Scope of Work', 'Quotation'],
    is_fallback: false,
  },
};

describe('briefScopeDraftAssistant', () => {
  it('builds a brief draft from digest with conservative sections', () => {
    const markdown = buildBriefDraftFromDigest(baseInput);

    expect(markdown).toContain('type: brief');
    expect(markdown).toContain('source: ai-brief-scope-draft-assistant');
    expect(markdown).toContain('confidence: high');
    expect(markdown).toContain('# Brief Draft: ปรับปรุงเว็บไซต์องค์กร');
    expect(markdown).toContain('## 3. สิ่งที่ยืนยันแล้ว');
    expect(markdown).toContain('- มีหน้า Home');
    expect(markdown).toContain('- [ ] ใครเป็นคนเตรียมรูปภาพและข้อความ');
    expect(markdown).toContain('ไม่รวมค่า domain/hosting');
  });

  it('builds a scope draft with in-scope, out-of-scope, questions, and risks', () => {
    const markdown = buildScopeDraftFromDigest(baseInput);

    expect(markdown).toContain('type: scope');
    expect(markdown).toContain('# Scope Draft: ปรับปรุงเว็บไซต์องค์กร');
    expect(markdown).toContain('เอกสารนี้เป็นร่างจาก AI/Rule-based digest');
    expect(markdown).toContain('| 1 | ออกแบบหน้า Home | ต้องยืนยันรายละเอียดก่อนล็อก scope | Medium |');
    expect(markdown).toContain('| 1 | ไม่รวมค่า domain/hosting ถ้าไม่ระบุ | ระบุให้ชัดในใบเสนอราคา/สัญญา |');
    expect(markdown).toContain('- [ ] ใครเป็นคนเตรียมรูปภาพและข้อความ');
    expect(markdown).toContain('ลูกค้าอาจขอแก้ดีไซน์หลายรอบโดยไม่จำกัด');
  });

  it('returns a draft pack with paths and risk metadata', () => {
    const pack = buildBriefScopeDraftPack(baseInput);

    expect(pack.suggestedBriefPath).toBe('baseline/brief-v1.0.md');
    expect(pack.suggestedScopePath).toBe('baseline/scope-v1.0.md');
    expect(pack.confidence).toBe('high');
    expect(pack.usedFallback).toBe(false);
    expect(pack.missingInformation).toEqual(['ยังไม่ชัดว่าใครเตรียมเนื้อหาและรูปภาพ']);
    expect(pack.scopeRisks).toEqual(['ลูกค้าอาจขอแก้ดีไซน์หลายรอบโดยไม่จำกัด']);
  });

  it('does not invent confirmed facts when digest has none', () => {
    const pack = buildBriefScopeDraftPack({
      ...baseInput,
      digest: {
        ...baseInput.digest,
        confidence: 'low',
        confirmed_facts: [],
        likely_in_scope: [],
        likely_out_of_scope: [],
        questions_to_ask: [],
        scope_creep_risks: [],
        is_fallback: true,
      },
    });

    expect(pack.usedFallback).toBe(true);
    expect(pack.briefMarkdown).toContain('ยังไม่มีข้อเท็จจริงที่ยืนยันได้จากคำขอโดยตรง');
    expect(pack.scopeMarkdown).toContain('รอระบุรายการงานที่รวมอยู่ในขอบเขต');
    expect(pack.scopeMarkdown).toContain('ยืนยันข้อมูลที่ยังไม่ชัดก่อนล็อก scope');
  });
});
