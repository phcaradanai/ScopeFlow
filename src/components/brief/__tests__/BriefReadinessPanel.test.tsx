import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import BriefReadinessPanel from '../BriefReadinessPanel';
import type { BriefReadinessResult } from '../../../lib/ai/brief-assistant/briefReadiness';

function makeReadiness(overrides: Partial<BriefReadinessResult> = {}): BriefReadinessResult {
  return {
    score: 7,
    maxScore: 17,
    percent: 41,
    level: 'needs_questions',
    summary: 'ข้อมูลเริ่มพอเห็นภาพ แต่ยังควรถามลูกค้าเพิ่มก่อนสร้าง Scope หรือเสนอราคา',
    signals: [],
    missingSignals: [],
    suggestedQuestions: ['ใครคือผู้ใช้งานหลัก?', 'ต้องการใช้งานเมื่อไหร่?'],
    canCreateBriefDraft: true,
    shouldCreateScopeDraft: false,
    shouldCreateQuotation: false,
    ...overrides,
  };
}

describe('BriefReadinessPanel', () => {
  it('renders readiness summary and suggested questions', () => {
    render(<BriefReadinessPanel readiness={makeReadiness()} />);

    expect(screen.getByText('Brief Readiness')).toBeInTheDocument();
    expect(screen.getByText(/41%/)).toBeInTheDocument();
    expect(screen.getByText('- ใครคือผู้ใช้งานหลัก?')).toBeInTheDocument();
    expect(screen.getByText('- ต้องการใช้งานเมื่อไหร่?')).toBeInTheDocument();
  });

  it('shows quotation as not recommended when readiness is insufficient', () => {
    render(<BriefReadinessPanel readiness={makeReadiness({ shouldCreateQuotation: false })} />);

    expect(screen.getByText('Quotation: ยังไม่ควรเสนอ')).toBeInTheDocument();
  });
});
