import type { ScopeDigestOutput } from '../scope-digest/scopeDigestSchema';

export function buildScopeControlPrompt(rawRequest: string, digest: ScopeDigestOutput, existingScopeDraft?: string): string {
  return `คุณคือ Scope Control Specialist สำหรับ freelancer/agency
หน้าที่ของคุณไม่ใช่แค่เขียนเอกสาร แต่ต้องช่วยกันงานงอก จำกัด scope ให้ชัด และบอกว่างานพร้อมเสนอราคาหรือยัง

ข้อมูลลูกค้าต้นฉบับ:
"""
${rawRequest}
"""

ผลวิเคราะห์ digest เดิม:
${JSON.stringify(digest, null, 2)}

${existingScopeDraft ? `ร่าง Scope ปัจจุบัน:\n"""\n${existingScopeDraft}\n"""\n` : ''}

กฎสำคัญ:
1. confirmed_scope_items ต้องมาจากสิ่งที่ลูกค้าพูดชัดเท่านั้น ห้ามเดา
2. assumed_scope_items คือสิ่งที่น่าจะรวม แต่ยังไม่ได้รับการยืนยัน
3. ambiguous_scope_items คือสิ่งที่ยังคลุมเครือและห้ามนำไปคิดราคา fixed-price แบบมั่นใจ
4. ถ้าข้อมูลสำคัญไม่พอ ต้อง readiness_to_quote = not_ready หรือ risky
5. ต้องสร้าง boundary clauses ที่ใช้กันงานงอกได้จริง
6. ต้องระบุ scope creep traps พร้อม change_request_trigger
7. man-hour เป็นช่วงประมาณเพื่อ reasoning เท่านั้น ไม่ใช่ราคาสุดท้าย
8. ถ้างานเกี่ยวระบบเดิม/bug/integration ไม่ชัด ให้แนะนำ phase_based หรือ time_and_material
9. ตอบเป็น JSON เท่านั้น ห้ามมี markdown หรือคำอธิบายอื่นปน

โครงสร้าง JSON ที่ต้องตอบ:
{
  "readiness_to_quote": "not_ready | risky | ready",
  "readiness_score": 0,
  "confirmed_scope_items": [
    { "item": "", "confidence": "confirmed", "evidence": "", "boundary_note": "" }
  ],
  "assumed_scope_items": [
    { "item": "", "confidence": "assumed", "evidence": "", "boundary_note": "" }
  ],
  "ambiguous_scope_items": [
    { "item": "", "confidence": "ambiguous", "evidence": "", "boundary_note": "" }
  ],
  "must_ask_before_quote": [],
  "optional_questions": [],
  "suggested_boundary_clauses": [],
  "scope_creep_traps": [
    { "item": "", "why_risky": "", "how_to_limit": "", "change_request_trigger": "" }
  ],
  "acceptance_risks": [
    { "scope_item": "", "missing_acceptance_criteria": "", "suggested_acceptance_criteria": "" }
  ],
  "tor_sections": {
    "objective": [],
    "deliverables": [],
    "requirements": [],
    "acceptance_criteria": [],
    "exclusions": []
  },
  "estimation_factors": [
    {
      "module": "",
      "complexity": "low | medium | high",
      "estimated_man_hours_min": 0,
      "estimated_man_hours_max": 0,
      "assumptions": [],
      "risk_buffer_percent": 0
    }
  ],
  "cost_reasoning": {
    "pricing_blockers": [],
    "cost_drivers": [],
    "suggested_pricing_model": "fixed_price | time_and_material | phase_based | retainer",
    "why": ""
  },
  "recommendation": ""
}`;
}
