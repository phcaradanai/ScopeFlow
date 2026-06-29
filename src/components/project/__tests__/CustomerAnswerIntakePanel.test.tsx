import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import CustomerAnswerIntakePanel from '../CustomerAnswerIntakePanel';
import * as customerAnswerIntake from '../../../lib/ai/customer-answer/customerAnswerIntake';

// Mock the AI classifier module since we only want to test the component behavior
vi.mock('../../../lib/ai/customer-answer/customerAnswerIntake', () => ({
  classifyCustomerAnswer: vi.fn(),
}));

describe('CustomerAnswerIntakePanel', () => {
  const mockScanFiles: any[] = [];
  let onContinueLifecycleMock: Mock;
  let onCreateFollowUpMock: Mock;
  let onStartRevisionReviewMock: Mock;
  let onCreateChangeRequestMock: Mock;

  beforeEach(() => {
    onContinueLifecycleMock = vi.fn();
    onCreateFollowUpMock = vi.fn();
    onStartRevisionReviewMock = vi.fn();
    onCreateChangeRequestMock = vi.fn();
    vi.clearAllMocks();
  });

  const renderPanel = () => {
    return render(
      <CustomerAnswerIntakePanel
        scanFiles={mockScanFiles}
        onContinueLifecycle={onContinueLifecycleMock}
        onCreateFollowUp={onCreateFollowUpMock}
        onStartRevisionReview={onStartRevisionReviewMock}
        onCreateChangeRequest={onCreateChangeRequestMock}
      />
    );
  };

  it('renders correctly', () => {
    (customerAnswerIntake.classifyCustomerAnswer as Mock).mockReturnValue({
      intent: 'unknown',
      confidence: 'low',
      riskLevel: 'low',
      summary: '',
      signals: [],
      recommendedAction: '',
      shouldCreateChangeRequest: false,
      shouldAskFollowUp: true,
    });
    
    renderPanel();
    expect(screen.getByText('Customer Answer Intake')).toBeInTheDocument();
  });

  it('triggers onContinueLifecycle for approval intent', () => {
    (customerAnswerIntake.classifyCustomerAnswer as Mock).mockReturnValue({
      intent: 'approval',
      confidence: 'high',
      riskLevel: 'low',
      summary: 'Approved',
      signals: [],
      recommendedAction: 'Continue',
      shouldCreateChangeRequest: false,
      shouldAskFollowUp: false,
    });

    renderPanel();
    
    fireEvent.change(screen.getByPlaceholderText(/เช่น: โอเค อนุมัติ/), { target: { value: 'Approved' } });
    
    const continueBtn = screen.getByRole('button', { name: /Continue Lifecycle/i });
    fireEvent.click(continueBtn);
    
    expect(onContinueLifecycleMock).toHaveBeenCalledTimes(1);
    expect(onContinueLifecycleMock).toHaveBeenCalledWith(expect.objectContaining({
      intent: 'approval',
      originalAnswer: 'Approved',
    }));
  });

  it('triggers onCreateFollowUp for clarification intent and passes context', () => {
    (customerAnswerIntake.classifyCustomerAnswer as Mock).mockReturnValue({
      intent: 'clarification',
      confidence: 'high',
      riskLevel: 'medium',
      summary: 'Needs clarification',
      signals: ['question'],
      recommendedAction: 'Ask for clarification',
      shouldCreateChangeRequest: false,
      shouldAskFollowUp: true,
    });

    renderPanel();
    fireEvent.change(screen.getByPlaceholderText(/เช่น: โอเค อนุมัติ/), { target: { value: 'What about this?' } });
    
    const followUpBtn = screen.getByRole('button', { name: /Prepare Follow-up/i });
    fireEvent.click(followUpBtn);
    
    expect(onCreateFollowUpMock).toHaveBeenCalledTimes(1);
    expect(onCreateFollowUpMock).toHaveBeenCalledWith(expect.objectContaining({
      intent: 'clarification',
      originalAnswer: 'What about this?',
    }));
  });

  it('triggers onStartRevisionReview for rejection intent and passes context', () => {
    (customerAnswerIntake.classifyCustomerAnswer as Mock).mockReturnValue({
      intent: 'rejection',
      confidence: 'high',
      riskLevel: 'high',
      summary: 'Rejected',
      signals: ['reject'],
      recommendedAction: 'Start revision review',
      shouldCreateChangeRequest: false,
      shouldAskFollowUp: true,
    });

    renderPanel();
    fireEvent.change(screen.getByPlaceholderText(/เช่น: โอเค อนุมัติ/), { target: { value: 'No, this is wrong.' } });
    
    const reviewBtn = screen.getByRole('button', { name: /Start Revision Review/i });
    fireEvent.click(reviewBtn);
    
    expect(onStartRevisionReviewMock).toHaveBeenCalledTimes(1);
    expect(onStartRevisionReviewMock).toHaveBeenCalledWith(expect.objectContaining({
      intent: 'rejection',
      originalAnswer: 'No, this is wrong.',
    }));
  });

  it('triggers onCreateChangeRequest for scope_change intent and passes context', () => {
    (customerAnswerIntake.classifyCustomerAnswer as Mock).mockReturnValue({
      intent: 'scope_change',
      confidence: 'high',
      riskLevel: 'high',
      summary: 'Change requested',
      signals: ['change', 'add'],
      recommendedAction: 'Create CR/DCR',
      shouldCreateChangeRequest: true,
      shouldAskFollowUp: true,
    });

    renderPanel();
    fireEvent.change(screen.getByPlaceholderText(/เช่น: โอเค อนุมัติ/), { target: { value: 'Add login with Facebook' } });
    
    const crBtn = screen.getByRole('button', { name: /Prepare CR\/DCR/i });
    fireEvent.click(crBtn);
    
    expect(onCreateChangeRequestMock).toHaveBeenCalledTimes(1);
    expect(onCreateChangeRequestMock).toHaveBeenCalledWith(expect.objectContaining({
      intent: 'scope_change',
      originalAnswer: 'Add login with Facebook',
    }));
  });
});
