import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import DiscoveryStartModal from '../DiscoveryStartModal';
import { createDiscoveryBriefFile } from '../../../lib/ai/brief-assistant/discoveryBriefFile';
import { createDiscoveryScopeFile } from '../../../lib/ai/brief-assistant/discoveryScopeFile';
import { createDiscoveryQuotationFile } from '../../../lib/ai/brief-assistant/discoveryQuotationFile';

vi.mock('../../../lib/ai/brief-assistant/discoveryBriefFile', () => ({
  createDiscoveryBriefFile: vi.fn().mockResolvedValue({
    path: '/workspace/clients/client-a/projects/project-a/baseline/brief-from-discovery.md',
    markdown: '---\ntype: brief\n---',
  }),
}));

vi.mock('../../../lib/ai/brief-assistant/discoveryScopeFile', () => ({
  createDiscoveryScopeFile: vi.fn().mockResolvedValue({
    path: '/workspace/clients/client-a/projects/project-a/baseline/scope-from-discovery.md',
    markdown: '---\ntype: scope\n---',
  }),
}));

vi.mock('../../../lib/ai/brief-assistant/discoveryQuotationFile', () => ({
  createDiscoveryQuotationFile: vi.fn().mockResolvedValue({
    path: '/workspace/clients/client-a/projects/project-a/baseline/quotation-from-discovery.md',
    markdown: '---\ntype: quotation\n---',
  }),
}));

const readyRequest = 'ต้องการเว็บขายของ มี admin ลูกค้า สินค้า ตะกร้า checkout ใช้งานบน web browser ข้อมูลจาก excel เชื่อม payment มีงบ 100000 บาท ภายใน 1 เดือน ตรวจรับเมื่อสั่งซื้อและรายงานใช้งานได้';

describe('DiscoveryStartModal', () => {
  it('starts discovery from a raw customer request', () => {
    render(<DiscoveryStartModal clientId="client-a" onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Start Discovery' })).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText('วางข้อความจากลูกค้าที่นี่ เช่น อยากทำระบบขายของออนไลน์...');
    fireEvent.change(textarea, { target: { value: 'อยากทำระบบให้ร้านหน่อย' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start Discovery' }));

    expect(screen.getByText('Discovery Workspace')).toBeInTheDocument();
    expect(screen.getByText('Customer Request')).toBeInTheDocument();
  });

  it('keeps start disabled until a request is entered', () => {
    render(<DiscoveryStartModal clientId="client-a" onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Start Discovery' })).toBeDisabled();
  });

  it('writes a discovery brief draft when project context exists', async () => {
    const onBriefCreated = vi.fn();
    render(
      <DiscoveryStartModal
        clientId="client-a"
        projectId="project-a"
        projectPath="/workspace/clients/client-a/projects/project-a"
        onClose={vi.fn()}
        onBriefCreated={onBriefCreated}
      />
    );

    const textarea = screen.getByPlaceholderText('วางข้อความจากลูกค้าที่นี่ เช่น อยากทำระบบขายของออนไลน์...');
    fireEvent.change(textarea, { target: { value: readyRequest } });
    fireEvent.click(screen.getByRole('button', { name: 'Start Discovery' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate Brief' }));

    await waitFor(() => {
      expect(createDiscoveryBriefFile).toHaveBeenCalledWith(expect.objectContaining({
        clientId: 'client-a',
        projectId: 'project-a',
        projectPath: '/workspace/clients/client-a/projects/project-a',
      }));
      expect(onBriefCreated).toHaveBeenCalledWith('/workspace/clients/client-a/projects/project-a/baseline/brief-from-discovery.md');
    });
  });

  it('writes a discovery scope draft when project context exists', async () => {
    const onScopeCreated = vi.fn();
    render(
      <DiscoveryStartModal
        clientId="client-a"
        projectId="project-a"
        projectPath="/workspace/clients/client-a/projects/project-a"
        onClose={vi.fn()}
        onScopeCreated={onScopeCreated}
      />
    );

    const textarea = screen.getByPlaceholderText('วางข้อความจากลูกค้าที่นี่ เช่น อยากทำระบบขายของออนไลน์...');
    fireEvent.change(textarea, { target: { value: readyRequest } });
    fireEvent.click(screen.getByRole('button', { name: 'Start Discovery' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate Scope' }));

    await waitFor(() => {
      expect(createDiscoveryScopeFile).toHaveBeenCalledWith(expect.objectContaining({
        projectId: 'project-a',
        projectPath: '/workspace/clients/client-a/projects/project-a',
      }));
      expect(onScopeCreated).toHaveBeenCalledWith('/workspace/clients/client-a/projects/project-a/baseline/scope-from-discovery.md');
    });
  });

  it('writes a discovery quotation draft when project context exists', async () => {
    const onQuotationCreated = vi.fn();
    render(
      <DiscoveryStartModal
        clientId="client-a"
        projectId="project-a"
        projectPath="/workspace/clients/client-a/projects/project-a"
        onClose={vi.fn()}
        onQuotationCreated={onQuotationCreated}
      />
    );

    const textarea = screen.getByPlaceholderText('วางข้อความจากลูกค้าที่นี่ เช่น อยากทำระบบขายของออนไลน์...');
    fireEvent.change(textarea, { target: { value: readyRequest } });
    fireEvent.click(screen.getByRole('button', { name: 'Start Discovery' }));
    fireEvent.click(screen.getByRole('button', { name: 'Generate Quotation' }));

    await waitFor(() => {
      expect(createDiscoveryQuotationFile).toHaveBeenCalledWith(expect.objectContaining({
        clientId: 'client-a',
        projectId: 'project-a',
        projectPath: '/workspace/clients/client-a/projects/project-a',
      }));
      expect(onQuotationCreated).toHaveBeenCalledWith('/workspace/clients/client-a/projects/project-a/baseline/quotation-from-discovery.md');
    });
  });
});
