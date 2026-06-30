import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import MvpGuidedPath from '../MvpGuidedPath';

describe('MvpGuidedPath', () => {
  it('shows the discovery-first MVP steps and start action', () => {
    const onStartDiscovery = vi.fn();

    render(
      <MvpGuidedPath
        hasBrief={false}
        hasScope={false}
        hasQuotation={false}
        onStartDiscovery={onStartDiscovery}
      />
    );

    expect(screen.getByText('MVP Guided Path')).toBeInTheDocument();
    expect(screen.getByText('1. Start Discovery')).toBeInTheDocument();
    expect(screen.getByText('2. Generate Brief')).toBeInTheDocument();
    expect(screen.getByText('3. Generate Scope')).toBeInTheDocument();
    expect(screen.getByText('4. Generate Quotation')).toBeInTheDocument();
    expect(screen.getByText('ยังไม่ครบ: กด Start Discovery แล้วสร้าง Brief, Scope และ Quotation ให้ครบก่อนประกาศว่าเอกสารพร้อม')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Start Discovery/ }));
    expect(onStartDiscovery).toHaveBeenCalledTimes(1);
  });

  it('shows ready state when all core discovery artifacts exist', () => {
    render(
      <MvpGuidedPath
        hasBrief
        hasScope
        hasQuotation
        onStartDiscovery={vi.fn()}
      />
    );

    expect(screen.getByText('พร้อมแล้ว: project นี้มี Brief, Scope และ Quotation จาก Discovery ครบสำหรับเริ่มคุยกับลูกค้าหรือทีมต่อ')).toBeInTheDocument();
  });
});
