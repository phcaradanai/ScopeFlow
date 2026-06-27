import type { ScopeBaselineFromQuote } from '../scope-baseline/scopeBaselineFromQuote';

export type ChangeRequestDecision = 'in_scope' | 'likely_change_request' | 'needs_review';
export type ChangeRequestImpact = 'none' | 'low' | 'medium' | 'high';

export interface ChangeRequestDetectionInput {
  new_request: string;
  baseline: ScopeBaselineFromQuote;
}

export interface ChangeRequestMatch {
  source: 'exclusion' | 'cr_trigger' | 'acceptance_criteria' | 'assumption' | 'locked_item';
  matched_text: string;
  reason: string;
}

export interface ChangeRequestDetectionResult {
  decision: ChangeRequestDecision;
  impact: ChangeRequestImpact;
  is_change_request: boolean;
  matched: ChangeRequestMatch[];
  possible_in_scope_reasons: string[];
  pricing_impact: string;
  timeline_impact: string;
  acceptance_impact: string;
  recommended_next_action: string;
  warnings: string[];
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .replace(/[|/()[\]{}.,:;!?"'`*_#>-]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length >= 3);
}

function hasUsefulOverlap(requestTokens: string[], sourceText: string): boolean {
  const sourceTokens = new Set(tokenize(sourceText));
  return requestTokens.some(token => sourceTokens.has(token));
}

function collectMatches(newRequest: string, baseline: ScopeBaselineFromQuote): ChangeRequestMatch[] {
  const requestTokens = tokenize(newRequest);
  const matches: ChangeRequestMatch[] = [];

  for (const item of baseline.locked_exclusions) {
    if (hasUsefulOverlap(requestTokens, item)) {
      matches.push({ source: 'exclusion', matched_text: item, reason: 'คำขอใหม่มีคำหรือประเด็นที่ชนกับ exclusion/boundary ที่ล็อกไว้' });
    }
  }

  for (const item of baseline.change_request_triggers) {
    if (hasUsefulOverlap(requestTokens, item)) {
      matches.push({ source: 'cr_trigger', matched_text: item, reason: 'คำขอใหม่ตรงกับ change request trigger ที่ระบุไว้ใน baseline' });
    }
  }

  for (const item of baseline.locked_acceptance_criteria) {
    if (hasUsefulOverlap(requestTokens, item)) {
      matches.push({ source: 'acceptance_criteria', matched_text: item, reason: 'คำขอใหม่เกี่ยวข้องกับ acceptance criteria ที่ล็อกไว้ ต้องตรวจว่ากระทบเงื่อนไขรับงานหรือไม่' });
    }
  }

  for (const item of baseline.locked_assumptions) {
    if (hasUsefulOverlap(requestTokens, item)) {
      matches.push({ source: 'assumption', matched_text: item, reason: 'คำขอใหม่เกี่ยวข้องกับ assumption ที่ใช้ล็อก baseline ต้องตรวจว่ายังเป็นจริงอยู่หรือไม่' });
    }
  }

  for (const item of baseline.locked_after_approval) {
    if (hasUsefulOverlap(requestTokens, item)) {
      matches.push({ source: 'locked_item', matched_text: item, reason: 'คำขอใหม่เกี่ยวข้องกับรายการที่ล็อกหลัง approved แล้ว' });
    }
  }

  return matches;
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

export function detectChangeRequest(input: ChangeRequestDetectionInput): ChangeRequestDetectionResult {
  const warnings: string[] = [];
  const text = normalize(input.new_request);

  if (!text) {
    warnings.push('ยังไม่มีคำขอใหม่สำหรับตรวจ change request');
  }

  const baselineReady = input.baseline.status === 'baseline_ready';
  if (!baselineReady) {
    warnings.push('Scope Baseline ยังไม่พร้อมใช้ตรวจ change request');
  }

  const matched = text ? collectMatches(input.new_request, input.baseline) : [];
  const hasExclusion = matched.some(item => item.source === 'exclusion');
  const hasCrTrigger = matched.some(item => item.source === 'cr_trigger');
  const hasLockedItem = matched.some(item => item.source === 'locked_item');
  const hasAcceptanceImpact = matched.some(item => item.source === 'acceptance_criteria');

  const expansionKeywords = ['เพิ่ม', 'ใหม่', 'อีก', 'เสริม', 'change', 'เพิ่มเติม', 'เพิ่มหน้า', 'เพิ่มระบบ', 'integrate', 'integration', 'เชื่อมต่อ', 'api', 'mobile app', 'report', 'dashboard', 'payment', 'gateway'];
  const soundsLikeExpansion = expansionKeywords.some(keyword => text.includes(keyword));

  const isChangeRequest = baselineReady && (hasExclusion || hasCrTrigger || hasLockedItem || (soundsLikeExpansion && matched.length > 0));
  const decision: ChangeRequestDecision = !baselineReady || !text
    ? 'needs_review'
    : isChangeRequest
      ? 'likely_change_request'
      : 'in_scope';

  const impact: ChangeRequestImpact = !baselineReady
    ? 'medium'
    : hasExclusion || hasCrTrigger
      ? 'high'
      : hasLockedItem || (hasAcceptanceImpact && soundsLikeExpansion)
        ? 'medium'
        : isChangeRequest
          ? 'low'
          : 'none';

  const possibleInScopeReasons = decision === 'in_scope'
    ? matched.length > 0
      ? ['พบคำที่เกี่ยวข้องกับ baseline แต่ไม่พบ exclusion, CR trigger หรือรายการล็อกที่ทำให้เป็น change request']
      : ['ไม่พบคำที่ชนกับ exclusions, CR triggers, locked items หรือ acceptance criteria ที่ล็อกไว้']
    : [];

  return {
    decision,
    impact,
    is_change_request: isChangeRequest,
    matched,
    possible_in_scope_reasons: unique(possibleInScopeReasons),
    pricing_impact: isChangeRequest ? 'ควรประเมินราคาเพิ่มหรือออก CR/DCR ก่อนเริ่มทำ' : 'ยังไม่พบผลกระทบราคาชัดเจนจาก baseline',
    timeline_impact: isChangeRequest ? 'ควรประเมิน timeline เพิ่ม เพราะคำขออาจอยู่นอก baseline ที่อนุมัติแล้ว' : 'ยังไม่พบผลกระทบ timeline ชัดเจนจาก baseline',
    acceptance_impact: hasAcceptanceImpact ? 'คำขอแตะ acceptance criteria ที่ล็อกไว้ ต้องตรวจผลกระทบการรับงาน' : 'ยังไม่พบผลกระทบต่อ acceptance criteria ชัดเจน',
    recommended_next_action: isChangeRequest
      ? 'เปิด Change Request/DCR document โดยอ้างอิง baseline, matched trigger และผลกระทบราคา/เวลา'
      : decision === 'needs_review'
        ? 'ให้ทีมตรวจคำขอเทียบ baseline ก่อนตอบลูกค้า เพราะมีประเด็นที่เกี่ยวข้องกับ baseline'
        : 'สามารถดำเนินการต่อใน scope เดิมได้ แต่ควรบันทึกคำขอไว้เป็นหลักฐาน',
    warnings,
  };
}
