import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DiscoveryStartModal from '../DiscoveryStartModal';
import { createDiscoveryBriefFile } from '../../../lib/ai/brief-assistant/discoveryBriefFile';
import { createDiscoveryScopeFile } from '../../../lib/ai/brief-assistant/discoveryScopeFile';
import { createDiscoveryQuotationFile } from '../../../lib/ai/brief-assistant/discoveryQuotationFile';
import { createProject } from '../../../lib/tauri-commands';

vi.mock('../../../lib/workspace-context', () => ({
  useWorkspace: () => ({ workspacePath: '/workspace' }),
}));

vi.mock('../../../lib/tauri-commands', () => ({
  createProject: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../lib/ai/brief-assistant/discoveryBriefFile', () => ({
  createDiscoveryBriefFile: vi.fn().mockResolvedValue({
    path: '/workspace/clients/client-a/projects/project-a/baseline/brief-from-discovery.md',
    markdown: 'brief',
  }),
}));

vi.mock('../../../lib/ai/brief-assistant/discoveryScopeFile', () => ({
  createDiscoveryScopeFile: vi.fn().mockResolvedValue({
    path: '/workspace/clients/client-a/projects/project-a/baseline/scope-from-discovery.md',
    markdown: 'scope',
  }),
}));

vi.mock('../../../lib/ai/brief-assistant/discoveryQuotationFile', () => ({
  createDiscoveryQuotationFile: vi.fn().mockResolvedValue({
    path: '/workspace/clients/client-a/projects/project-a/baseline/quotation-from-discovery.md',
    markdown: 'quotation',
  }),
}));

const readyRequest = 'ต้องการเว็บขายของ มี admin ลูกค้า สินค้า ตะกร้า ใช้งานบน web browser เชื่อม payment มีงบ 100000 บาท ภายใน 1 เดือน ตรวจรับเมื่อสั่งซื้อและรายงานใช้งานได้';
const mockedCreateProject = vi.mocked(createProject);
const mockedCreateDiscoveryBriefFile = vi.mocked(createDiscoveryBriefFile);
const mockedCreateDiscoveryScopeFile = vi.mocked(createDiscoveryScopeFile);
const mockedCreateDiscoveryQuotationFile = vi.mocked(createDiscoveryQuotationFile);

function startDiscovery(request = readyRequest) {
  fireEvent.change(screen.getByPlaceholderText('วางข้อความจากลูกค้าที่นี่ เช่น อยากทำระบบขายของออนไลน์...'), { target: { value: request } });
  fireEvent.click(screen.getByRole('button', { name: 'Start Discovery' }));
}

describe('DiscoveryStartModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('starts discovery from a raw customer request', () => {
    render(<DiscoveryStartModal clientId="client-a" onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Start Discovery' })).toBeInTheDocument();
    startDiscovery('อยากทำระบบให้ร้านหน่อย');

    expect(screen.getByText('Discovery Workspace')).toBeInTheDocument();
    expect(screen.getByText('Customer Request')).toBeInTheDocument();
  });

  it('keeps start disabled until a request is entered', () => {
    render(<DiscoveryStartModal clientId="client-a" onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Start Discovery' })).toBeDisabled();
  });

  it('writes a discovery brief draft when project context exists', async () => {
    const onBriefCreated = vi.fn();
    render(<DiscoveryStartModal clientId="client-a" projectId="project-a" projectPath="/workspace/clients/client-a/projects/project-a" onClose={vi.fn()} onBriefCreated={onBriefCreated} />);

    startDiscovery();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Brief' }));

    await waitFor(() => {
      expect(mockedCreateDiscoveryBriefFile).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'client-a', projectId: 'project-a', projectPath: '/workspace/clients/client-a/projects/project-a' }));
      expect(onBriefCreated).toHaveBeenCalledWith('/workspace/clients/client-a/projects/project-a/baseline/brief-from-discovery.md');
    });
  });

  it('creates a project and opens the brief when discovery starts without project context', async () => {
    const onClose = vi.fn();
    const onBriefCreated = vi.fn();
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);
    render(<DiscoveryStartModal clientId="client-a" onClose={onClose} onBriefCreated={onBriefCreated} />);

    startDiscovery();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Brief' }));

    await waitFor(() => {
      expect(mockedCreateProject).toHaveBeenCalledWith('/workspace', 'client-a', 'discovery-1234567890', expect.stringContaining('Discovery Brief'), 'new-project');
      expect(mockedCreateDiscoveryBriefFile).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'client-a', projectId: 'discovery-1234567890', projectPath: '/workspace/clients/client-a/projects/discovery-1234567890' }));
      expect(onBriefCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('writes a discovery scope draft when project context exists', async () => {
    render(<DiscoveryStartModal clientId="client-a" projectId="project-a" projectPath="/workspace/clients/client-a/projects/project-a" onClose={vi.fn()} onScopeCreated={vi.fn()} />);

    startDiscovery();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Scope' }));

    await waitFor(() => expect(mockedCreateDiscoveryScopeFile).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'project-a', projectPath: '/workspace/clients/client-a/projects/project-a' })));
  });

  it('writes a discovery quotation draft when project context exists', async () => {
    render(<DiscoveryStartModal clientId="client-a" projectId="project-a" projectPath="/workspace/clients/client-a/projects/project-a" onClose={vi.fn()} onQuotationCreated={vi.fn()} />);

    startDiscovery();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Quotation' }));

    await waitFor(() => expect(mockedCreateDiscoveryQuotationFile).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'client-a', projectId: 'project-a', projectPath: '/workspace/clients/client-a/projects/project-a' })));
  });
});
