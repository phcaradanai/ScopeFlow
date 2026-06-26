import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildScopeDigestPrompt } from '../scope-digest/scopeDigestPrompt';
import { validateScopeDigest } from '../scope-digest/scopeDigestValidator';
import { getRuleBasedFallback } from '../scope-digest/scopeDigestFallback';
import { processScopeDigest } from '../scope-digest/scopeDigestSkill';
import { generateBriefDocument } from '../../brief-builder';
import * as settings from '../../settings';

// Mock settings to return enabled/disabled AI
vi.mock('../../settings', () => ({
  getAiSettings: vi.fn(),
  saveAiSettings: vi.fn(),
}));

describe('Scope Digest Skill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('1. prompt builder includes raw customer request', () => {
    const raw = "อยากทำแอพส่งอาหาร";
    const prompt = buildScopeDigestPrompt(raw);
    expect(prompt).toContain("อยากทำแอพส่งอาหาร");
  });

  it('2. prompt tells AI not to invent confirmed facts', () => {
    const prompt = buildScopeDigestPrompt("test");
    expect(prompt).toContain("ห้ามคิดขึ้นเองสำหรับสิ่งที่เป็น \"confirmed_facts\"");
  });

  it('3. valid JSON response parses correctly', () => {
    const mockJson = JSON.stringify({
      detected_project_type: "Mobile App",
      confidence: "high",
      understanding: ["สร้างแอพ"],
      confirmed_facts: ["ข้อความแชท"],
      assumptions: ["น่าจะต้องใช้เน็ต"],
      unclear_points: ["งบเท่าไหร่"],
      questions_to_ask: ["มี Server ไหม"],
      likely_in_scope: ["iOS", "Android"],
      likely_out_of_scope: ["Web"],
      scope_creep_risks: ["เพิ่มฟีเจอร์"],
      suggested_next_documents: ["brief-v1.0.md"]
    });

    const parsed = validateScopeDigest(mockJson);
    expect(parsed.detected_project_type).toBe("Mobile App");
    expect(parsed.confidence).toBe("high");
    expect(parsed.understanding).toEqual(["สร้างแอพ"]);
    expect(parsed.confirmed_facts).toEqual(["ข้อความแชท"]);
  });

  it('4. invalid JSON triggers error which would lead to fallback', () => {
    expect(() => validateScopeDigest("not json")).toThrow("INVALID_JSON");
  });

  it('5. disabled AI uses rule-based fallback', async () => {
    vi.mocked(settings.getAiSettings).mockResolvedValue({
      mode: 'off',
      baseUrl: 'http://localhost:11434',
      model: 'llama3',
      enabled: false
    });

    const result = await processScopeDigest('/mock', "แอปขายของ online", "เว็บขายของ");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.detected_project_type).toBe("เว็บขายของ");
    expect(result.questions_to_ask.length).toBeGreaterThan(0);
  });

  it('6. "แอปขายของ online" mocked AI response creates useful e-commerce digest', async () => {
    vi.mocked(settings.getAiSettings).mockResolvedValue({
      mode: 'ollama',
      baseUrl: 'http://localhost:11434',
      model: 'llama3',
      enabled: true
    });

    const mockResponse = {
      detected_project_type: "เว็บขายของ",
      confidence: "high",
      understanding: ["แอพ E-commerce"],
      confirmed_facts: ["ขายของ online"],
      assumptions: ["มีตะกร้า"],
      unclear_points: [],
      questions_to_ask: ["จ่ายเงินยังไง"],
      likely_in_scope: ["ตะกร้าสินค้า"],
      likely_out_of_scope: ["แอพ Delivery"],
      scope_creep_risks: ["เพิ่ม Payment"],
      suggested_next_documents: []
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ response: JSON.stringify(mockResponse) })
    });

    const result = await processScopeDigest('/mock', "แอปขายของ online", "เว็บขายของ");
    expect(global.fetch).toHaveBeenCalled();
    expect(result.detected_project_type).toBe("เว็บขายของ");
    expect(result.likely_in_scope).toContain("ตะกร้าสินค้า");
  });

  it('7. confirmed_facts do not contain assumptions in fallback', () => {
    const fallback = getRuleBasedFallback("ทำแอพ", "อื่น ๆ");
    expect(fallback.confirmed_facts[0]).toContain("ทำแอพ");
    expect(fallback.assumptions).not.toEqual(fallback.confirmed_facts);
  });

  it('8. brief renderer includes understanding/questions/out-of-scope/risks from AI digest', () => {
    const mockDigest = {
      detected_project_type: "Custom",
      confidence: "high" as const,
      understanding: ["Understanding AI"],
      confirmed_facts: ["Confirmed AI"],
      assumptions: ["Assumption AI"],
      unclear_points: ["Unclear AI"],
      questions_to_ask: ["Question AI"],
      likely_in_scope: ["Scope AI"],
      likely_out_of_scope: ["Out Scope AI"],
      scope_creep_risks: ["Risk AI"],
      suggested_next_documents: ["Doc AI"]
    };

    const brief = generateBriefDocument({
      raw_request: "Test",
      project_type: "อื่น ๆ",
      project: "proj1",
      client: "client1",
      projectName: "Test Proj",
      ai_digest: mockDigest
    });

    expect(brief).toContain("Understanding AI");
    expect(brief).toContain("Question AI");
    expect(brief).toContain("Out Scope AI");
    expect(brief).toContain("Risk AI");
  });

  it('9. API key or provider secrets are not written into generated brief', () => {
    const brief = generateBriefDocument({
      raw_request: "Test",
      project_type: "อื่น ๆ",
      project: "proj1",
      client: "client1",
      projectName: "Test Proj"
    });

    expect(brief).not.toContain("localhost:11434");
    expect(brief).not.toContain("api_key");
    expect(brief).not.toContain("llama3");
  });

  it('10. existing non-AI brief flow still works', () => {
    const brief = generateBriefDocument({
      raw_request: "ทำเว็บไซต์บริษัทให้หน่อย",
      project_type: "เว็บไซต์บริษัท",
      project: "proj1",
      client: "client1",
      projectName: "Test Proj"
    });

    expect(brief).toContain("หน้าแรก (Home)");
    expect(brief).toContain("เว็บไซต์บริษัท");
  });
});
