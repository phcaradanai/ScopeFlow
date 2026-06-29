import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import WelcomeScreen from '../WelcomeScreen';

vi.mock('../../lib/workspace-context', () => ({
  useWorkspace: () => ({ setWorkspacePath: vi.fn() }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  ask: vi.fn(),
}));

vi.mock('../../lib/tauri-commands', () => ({
  createWorkspace: vi.fn(),
  restoreWorkspace: vi.fn(),
}));

vi.mock('../../lib/templates', () => ({
  generateWorkspaceConfig: vi.fn(() => 'workspace: {}'),
}));

vi.mock('../../lib/demo-generator', () => ({
  generateDemoWorkspace: vi.fn(),
}));

describe('WelcomeScreen', () => {
  it('promotes demo and discovery-first onboarding for first-time users', () => {
    render(<WelcomeScreen />);

    expect(screen.getByText('เริ่มจากคำขอลูกค้า → ถามให้ครบ → สร้าง Brief, Scope และ Quotation')).toBeInTheDocument();
    expect(screen.getByText('ทางที่แนะนำสำหรับผู้ใช้ใหม่')).toBeInTheDocument();
    expect(screen.getByText('สร้าง Demo แล้วเดินตาม Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Start Discovery ช่วยถามต่อก่อนออกเอกสาร')).toBeInTheDocument();
    expect(screen.getByText('สร้าง Brief, Scope, Quotation จากข้อมูลชุดเดียว')).toBeInTheDocument();
  });
});
