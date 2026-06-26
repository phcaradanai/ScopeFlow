import YAML from 'yaml';
import { todayISO } from '../../validation';
import type { ScopeDigestOutput } from '../scope-digest/scopeDigestSchema';

export interface BriefScopeDraftInput {
  rawRequest: string;
  projectType: string;
  projectId: string;
  clientId: string;
  projectName: string;
  digest: ScopeDigestOutput;
}

export interface BriefScopeDraftPack {
  briefMarkdown: string;
  scopeMarkdown: string;
  suggestedBriefPath: string;
  suggestedScopePath: string;
  missingInformation: string[];
  scopeRisks: string[];
  confidence: ScopeDigestOutput['confidence'];
  usedFallback: boolean;
}

function cleanItems(items: string[] | undefined): string[] {
  return (items || []).map(item => item.trim()).filter(Boolean);
}

function bulletList(items: string[] | undefined, emptyText: string): string {
  const validItems = cleanItems(items);
  if (validItems.length === 0) return `- ${emptyText}\n`;
  return validItems.map(item => `- ${item}`).join('\n') + '\n';
}

function checklist(items: string[] | undefined, emptyText: string): string {
  const validItems = cleanItems(items);
  if (validItems.length === 0) return `- [ ] ${emptyText}\n`;
  return validItems.map(item => `- [ ] ${item}`).join('\n') + '\n';
}

function tableRows(items: string[] | undefined, emptyText: string, columns: 'scope' | 'outOfScope' | 'deliverables') {
  const validItems = cleanItems(items);
  const source = validItems.length > 0 ? validItems : [emptyText];

  return source.map((item, index) => {
    if (columns === 'scope') return `| ${index + 1} | ${item} | ต้องยืนยันรายละเอียดก่อนล็อก scope | Medium |`;
    if (columns === 'outOfScope') return `| ${index + 1} | ${item} | ระบุให้ชัดในใบเสนอราคา/สัญญา |`;
    return `| ${index + 1} | ${item} | ต้องกำหนดรูปแบบส่งมอบและผู้รับผิดชอบ |`;
  }).join('\n') + '\n';
}

function frontmatter(data: Record<string, unknown>) {
  return `---\n${YAML.stringify(data).trim()}\n---\n\n`;
}

export function buildBriefDraftFromDigest(input: BriefScopeDraftInput): string {
  const today = todayISO();
  const digest = input.digest;

  return frontmatter({
    type: 'brief',
    version: '1.0',
    status: 'draft',
    source: 'ai-brief-scope-draft-assistant',
    project: input.projectId,
    client: input.clientId,
    project_type: input.projectType,
    confidence: digest.confidence,
    created: today,
    updated: today,
    locked: false,
  }) + `# Brief Draft: ${input.projectName}\n\n` +
`## 1. คำขอลูกค้าต้นฉบับ (Raw Request)\n\n` +
`> ${input.rawRequest.replace(/\n/g, '\n> ')}\n\n` +
`## 2. ความเข้าใจเบื้องต้น (Understanding)\n\n` +
`${bulletList(digest.understanding, 'ยังไม่มีความเข้าใจที่ชัดเจน ควรถามลูกค้าเพิ่มเติม')}\n` +
`## 3. สิ่งที่ยืนยันแล้ว (Confirmed Facts)\n\n` +
`${bulletList(digest.confirmed_facts, 'ยังไม่มีข้อเท็จจริงที่ยืนยันได้จากคำขอโดยตรง')}\n` +
`## 4. สมมติฐานที่ต้องยืนยัน (Assumptions)\n\n` +
`${bulletList(digest.assumptions, 'ยังไม่มีสมมติฐานเพิ่มเติม')}\n` +
`## 5. สิ่งที่ยังไม่ชัด (Missing / Unclear)\n\n` +
`${bulletList(digest.unclear_points, 'ยังไม่มีข้อมูลที่ระบุว่าไม่ชัด')}\n` +
`## 6. คำถามที่ควรถามลูกค้า (Questions to Ask)\n\n` +
`${checklist(digest.questions_to_ask, 'ยืนยันเป้าหมาย ขอบเขต งบประมาณ และระยะเวลาของงาน')}\n` +
`## 7. ขอบเขตที่น่าจะรวม (Likely In-Scope)\n\n` +
`${bulletList(digest.likely_in_scope, 'รอข้อมูลเพิ่มเติมก่อนระบุ in-scope')}\n` +
`## 8. สิ่งที่ควรระบุว่าไม่รวม (Likely Out-of-Scope)\n\n` +
`${bulletList(digest.likely_out_of_scope, 'ควรระบุ out-of-scope ให้ชัดก่อนเสนอราคา')}\n` +
`## 9. ความเสี่ยงงานงอก (Scope Creep Risks)\n\n` +
`${bulletList(digest.scope_creep_risks, 'ความต้องการยังไม่ชัด อาจทำให้ประเมินราคาหรือระยะเวลาผิด')}\n` +
`## 10. เอกสารที่ควรทำต่อ (Next Documents)\n\n` +
`${checklist(digest.suggested_next_documents, 'จัดทำ Scope of Work หลังปิดคำถามสำคัญ')}\n`;
}

export function buildScopeDraftFromDigest(input: BriefScopeDraftInput): string {
  const today = todayISO();
  const digest = input.digest;

  return frontmatter({
    type: 'scope',
    version: '1.0',
    status: 'draft',
    source: 'ai-brief-scope-draft-assistant',
    project: input.projectId,
    client: input.clientId,
    project_type: input.projectType,
    confidence: digest.confidence,
    created: today,
    updated: today,
    locked: false,
    approved_by: '',
    approval_ref: '',
  }) + `# Scope Draft: ${input.projectName}\n\n` +
`> เอกสารนี้เป็นร่างจาก AI/Rule-based digest ต้องตรวจทานและยืนยันกับลูกค้าก่อนใช้เสนอราคา\n\n` +
`## ภาพรวมโครงการ (Project Overview)\n\n` +
`${bulletList(digest.understanding, 'ยังต้องสรุปภาพรวมโครงการจากคำตอบลูกค้าเพิ่มเติม')}\n` +
`## ขอบเขตงาน (Scope of Work)\n\n` +
`### สิ่งที่รวมอยู่ในขอบเขต (In Scope)\n\n` +
`| # | รายการ | รายละเอียดที่ต้องยืนยัน | ลำดับความสำคัญ |\n|---|--------|-------------------------|----------------|\n` +
`${tableRows(digest.likely_in_scope, 'รอระบุรายการงานที่รวมอยู่ในขอบเขต', 'scope')}\n` +
`### สิ่งที่ไม่รวมอยู่ในขอบเขต (Out of Scope)\n\n` +
`| # | รายการ | หมายเหตุ |\n|---|--------|---------|\n` +
`${tableRows(digest.likely_out_of_scope, 'รอระบุสิ่งที่ไม่รวมเพื่อป้องกัน scope creep', 'outOfScope')}\n` +
`## สิ่งที่ส่งมอบ (Deliverables)\n\n` +
`| # | สิ่งที่ส่งมอบ | รายละเอียด |\n|---|--------------|------------|\n` +
`${tableRows(digest.suggested_next_documents, 'Scope document / quotation / acceptance checklist ตามความเหมาะสม', 'deliverables')}\n` +
`## สมมติฐานและข้อจำกัด (Assumptions & Constraints)\n\n` +
`${bulletList(digest.assumptions, 'ยังไม่มีสมมติฐานที่บันทึกไว้')}\n` +
`## คำถามค้างก่อนล็อก Scope\n\n` +
`${checklist(digest.questions_to_ask, 'ยืนยันข้อมูลที่ยังไม่ชัดก่อนล็อก scope')}\n` +
`## ความเสี่ยงงานงอก\n\n` +
`${bulletList(digest.scope_creep_risks, 'ความต้องการยังไม่ชัด อาจเกิดงานเพิ่มภายหลัง')}\n` +
`## เงื่อนไขการตรวจรับเบื้องต้น (Draft Acceptance Criteria)\n\n` +
`${checklist(digest.confirmed_facts, 'ลูกค้าตรวจรับตามขอบเขตที่ยืนยันและเอกสารที่ส่งมอบ')}\n`;
}

export function buildBriefScopeDraftPack(input: BriefScopeDraftInput): BriefScopeDraftPack {
  return {
    briefMarkdown: buildBriefDraftFromDigest(input),
    scopeMarkdown: buildScopeDraftFromDigest(input),
    suggestedBriefPath: 'baseline/brief-v1.0.md',
    suggestedScopePath: 'baseline/scope-v1.0.md',
    missingInformation: cleanItems(input.digest.unclear_points),
    scopeRisks: cleanItems(input.digest.scope_creep_risks),
    confidence: input.digest.confidence,
    usedFallback: input.digest.is_fallback === true,
  };
}
