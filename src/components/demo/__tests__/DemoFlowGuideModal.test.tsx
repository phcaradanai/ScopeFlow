import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import DemoFlowGuideModal from '../DemoFlowGuideModal';

describe('DemoFlowGuideModal', () => {
  it('guides users through the discovery-first MVP flow', () => {
    render(
      <DemoFlowGuideModal
        projectPath="/workspace/clients/client-a/projects/project-a"
        onOpenProject={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Discovery-first Tutorial')).toBeInTheDocument();
    expect(screen.getByText('เดิน MVP ให้จบ: Discovery → Brief → Scope → Quotation')).toBeInTheDocument();
    expect(screen.getByText('1. เริ่มที่ Project Overview')).toBeInTheDocument();
    expect(screen.getByText('2. เริ่ม Discovery จากคำขอลูกค้า')).toBeInTheDocument();
    expect(screen.getByText('3. สร้างและตรวจ Brief จาก Discovery')).toBeInTheDocument();
    expect(screen.getByText('4. สร้างและตรวจ Scope จาก Discovery')).toBeInTheDocument();
    expect(screen.getByText('5. สร้างและตรวจ Quotation จาก Discovery')).toBeInTheDocument();
  });

  it('shows the expected generated artifact paths in the checklist flow', () => {
    render(
      <DemoFlowGuideModal
        projectPath="/workspace/clients/client-a/projects/project-a"
        onOpenProject={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('3. สร้างและตรวจ Brief จาก Discovery'));
    expect(screen.getByText(/Target:.*baseline\/brief-from-discovery\.md/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('4. สร้างและตรวจ Scope จาก Discovery'));
    expect(screen.getByText(/Target:.*baseline\/scope-from-discovery\.md/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('5. สร้างและตรวจ Quotation จาก Discovery'));
    expect(screen.getByText(/Target:.*baseline\/quotation-from-discovery\.md/)).toBeInTheDocument();
  });
});
