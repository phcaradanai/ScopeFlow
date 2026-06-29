import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import DiscoveryStartModal from '../DiscoveryStartModal';

describe('DiscoveryStartModal', () => {
  it('starts discovery from a raw customer request', () => {
    render(<DiscoveryStartModal clientId="client-a" onClose={vi.fn()} />);

    expect(screen.getByText('Start Discovery')).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText('วางข้อความจากลูกค้าที่นี่ เช่น อยากทำระบบขายของออนไลน์...');
    fireEvent.change(textarea, { target: { value: 'อยากทำระบบให้ร้านหน่อย' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start Discovery' }));

    expect(screen.getByText('Discovery Workspace')).toBeInTheDocument();
    expect(screen.getByText('อยากทำระบบให้ร้านหน่อย')).toBeInTheDocument();
  });

  it('keeps start disabled until a request is entered', () => {
    render(<DiscoveryStartModal clientId="client-a" onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Start Discovery' })).toBeDisabled();
  });
});
