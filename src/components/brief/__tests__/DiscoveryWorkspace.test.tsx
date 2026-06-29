import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import DiscoveryWorkspace from '../DiscoveryWorkspace';
import { createDiscoverySession } from '../../../lib/ai/brief-assistant/discoverySession';

function renderWorkspace(overrides: Partial<Parameters<typeof DiscoveryWorkspace>[0]> = {}) {
  const session = createDiscoverySession({
    id: 'session-1',
    clientId: 'client-a',
    rawRequest: 'อยากทำระบบให้ร้านหน่อย',
    now: '2026-01-01T00:00:00.000Z',
  });

  const props = {
    session,
    answerDraft: '',
    onAnswerDraftChange: vi.fn(),
    onSubmitAnswer: vi.fn(),
    onGenerateBrief: vi.fn(),
    onGenerateScope: vi.fn(),
    onGenerateQuotation: vi.fn(),
    ...overrides,
  };

  render(<DiscoveryWorkspace {...props} />);
  return props;
}

describe('DiscoveryWorkspace', () => {
  it('renders request, readiness, and next best question', () => {
    renderWorkspace();

    expect(screen.getByText('Discovery Workspace')).toBeInTheDocument();
    expect(screen.getByText('Customer Request')).toBeInTheDocument();
    expect(screen.getByText('Next Best Question')).toBeInTheDocument();
    expect(screen.getByText('Brief Readiness')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('วางคำตอบลูกค้าหรือ note เพิ่มเติมที่นี่...')).toBeInTheDocument();
  });

  it('submits answer drafts through callbacks', () => {
    const props = renderWorkspace({ answerDraft: 'ต้องมีสินค้า ตะกร้า และรายงานยอดขาย' });

    fireEvent.click(screen.getByRole('button', { name: 'บันทึกคำตอบและประเมินใหม่' }));

    expect(props.onSubmitAnswer).toHaveBeenCalledTimes(1);
  });

  it('disables generate actions when the session is not ready', () => {
    renderWorkspace();

    expect(screen.getByRole('button', { name: 'Generate Brief' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Generate Scope' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Generate Quotation' })).toBeDisabled();
  });
});
