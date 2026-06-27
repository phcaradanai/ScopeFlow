import type { CloseoutLatestReopenDecisionSummary } from './closeoutReopenDecisionDetection';

export interface CloseoutReopenOutputTemplateInput {
  project_name: string;
  project_path: string;
  decision: CloseoutLatestReopenDecisionSummary;
  created_at?: string;
}

export interface CloseoutReopenOutputTemplate {
  can_create: boolean;
  path?: string;
  markdown?: string;
  label: string;
  reason: string;
}

function safeTimestamp(value: string): string {
  return value.replace(/[:.]/g, '-');
}

function baseHeader(title: string, projectName: string, createdAt: string, decisionLabel?: string): string[] {
  return [
    `# ${title} — ${projectName}`,
    '',
    `- Created at: ${createdAt}`,
    `- Source: Reopen / Change Request decision`,
    decisionLabel ? `- Decision: ${decisionLabel}` : '- Decision: unknown',
    '',
  ];
}

export function buildCloseoutReopenOutputTemplate(input: CloseoutReopenOutputTemplateInput): CloseoutReopenOutputTemplate {
  if (!input.decision.has_reopen_request || !input.decision.has_decision || !input.decision.selected_decision_id) {
    return {
      can_create: false,
      label: 'Create reopen output',
      reason: 'เลือก decision หนึ่งข้อใน reopen-request ก่อน จึงจะสร้าง output artifact ได้',
    };
  }

  const createdAt = input.created_at || new Date().toISOString();
  const stamp = safeTimestamp(createdAt);
  const decisionLabel = input.decision.selected_decision_label;

  if (input.decision.selected_decision_id === 'reject_request') {
    return {
      can_create: true,
      label: 'Create rejection response',
      reason: 'สร้างเอกสารตอบปฏิเสธหรือระบุ out-of-scope จาก selected reopen decision',
      path: `${input.project_path}/changes/rejection-response-${stamp}.md`,
      markdown: [
        ...baseHeader('Rejection Response / Out-of-Scope Note', input.project_name, createdAt, decisionLabel),
        '## Customer request summary',
        '',
        '- ...',
        '',
        '## Reason for rejection / out-of-scope',
        '',
        '- ...',
        '',
        '## Accepted baseline reference',
        '',
        '- ...',
        '',
        '## Suggested next option',
        '',
        '- Open a separate change request if the customer wants this work quoted.',
        '',
      ].join('\n'),
    };
  }

  if (input.decision.selected_decision_id === 'quote_change_request') {
    return {
      can_create: true,
      label: 'Create CR quotation',
      reason: 'สร้าง draft สำหรับประเมินขอบเขต ราคา เวลา และ approval ของ change request',
      path: `${input.project_path}/changes/change-request-quote-${stamp}.md`,
      markdown: [
        ...baseHeader('Change Request Quote Draft', input.project_name, createdAt, decisionLabel),
        '## Change request summary',
        '',
        '- ...',
        '',
        '## Proposed scope change',
        '',
        '- In scope: ...',
        '- Out of scope: ...',
        '',
        '## Estimate',
        '',
        '- Price: ...',
        '- Timeline: ...',
        '',
        '## Approval condition',
        '',
        '- Work starts only after customer approval of this change request.',
        '',
      ].join('\n'),
    };
  }

  if (input.decision.selected_decision_id === 'create_new_scope') {
    return {
      can_create: true,
      label: 'Create new scope brief',
      reason: 'สร้าง brief/scope baseline ใหม่ แยกจากงานเดิมที่ finalized แล้ว',
      path: `${input.project_path}/scope/new-scope-brief-${stamp}.md`,
      markdown: [
        ...baseHeader('New Scope Brief', input.project_name, createdAt, decisionLabel),
        '## Background from closed project',
        '',
        '- ...',
        '',
        '## New objective',
        '',
        '- ...',
        '',
        '## Initial scope',
        '',
        '- ...',
        '',
        '## Questions / assumptions',
        '',
        '- ...',
        '',
      ].join('\n'),
    };
  }

  if (input.decision.selected_decision_id === 'need_more_information') {
    return {
      can_create: true,
      label: 'Create customer questions',
      reason: 'สร้างรายการคำถามเพื่อให้ลูกค้าตอบก่อนตัดสินใจต่อ',
      path: `${input.project_path}/changes/customer-questions-${stamp}.md`,
      markdown: [
        ...baseHeader('Customer Questions for Reopen Request', input.project_name, createdAt, decisionLabel),
        '## Questions to customer',
        '',
        '1. ...',
        '2. ...',
        '3. ...',
        '',
        '## Why this information is needed',
        '',
        '- ...',
        '',
        '## Decision after answers',
        '',
        '- [ ] Reject request',
        '- [ ] Quote as Change Request',
        '- [ ] Create new scope',
        '',
      ].join('\n'),
    };
  }

  return {
    can_create: false,
    label: 'Create reopen output',
    reason: 'Decision นี้ยังไม่มี output template ที่รองรับ',
  };
}
