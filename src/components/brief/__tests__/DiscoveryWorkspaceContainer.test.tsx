import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import DiscoveryWorkspaceContainer from '../DiscoveryWorkspaceContainer';

describe('DiscoveryWorkspaceContainer', () => {
  it('creates a session from raw request and records customer answers', () => {
    render(
      <DiscoveryWorkspaceContainer
        clientId="client-a"
        rawRequest="อยากทำระบบให้ร้านหน่อย"
      />
    );

    expect(screen.getByText('Discovery Workspace')).toBeInTheDocument();
    expect(screen.getByText('อยากทำระบบให้ร้านหน่อย')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('วางคำตอบลูกค้าหรือ note เพิ่มเติมที่นี่...');
    fireEvent.change(textarea, { target: { value: 'ต้องมีสินค้า ตะกร้า และรายงานยอดขาย' } });
    fireEvent.click(screen.getByRole('button', { name: 'บันทึกคำตอบและประเมินใหม่' }));

    expect(screen.getByText('ต้องมีสินค้า ตะกร้า และรายงานยอดขาย')).toBeInTheDocument();
  });

  it('calls generation callbacks with the current session', () => {
    const onGenerateBrief = vi.fn();

    render(
      <DiscoveryWorkspaceContainer
        clientId="client-a"
        rawRequest="ต้องการเว็บขายของ มี admin ลูกค้า สินค้า ตะกร้า checkout ใช้งานบน web browser ข้อมูลจาก excel เชื่อม payment มีงบ 100000 บาท ภายใน 1 เดือน ตรวจรับเมื่อสั่งซื้อและรายงานใช้งานได้"
        onGenerateBrief={onGenerateBrief}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Generate Brief' }));

    expect(onGenerateBrief).toHaveBeenCalledTimes(1);
    expect(onGenerateBrief.mock.calls[0][0].canGenerateBrief).toBe(true);
  });
});
