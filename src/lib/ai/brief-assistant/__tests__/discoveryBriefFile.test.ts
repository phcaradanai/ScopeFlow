import { describe, expect, it, vi, beforeEach } from 'vitest';
import { answerDiscoveryQuestion, createDiscoverySession } from '../discoverySession';
import { createDiscoveryBriefFile } from '../discoveryBriefFile';
import * as tauriCommands from '../../../tauri-commands';

vi.mock('../../../tauri-commands', () => ({
  createDocument: vi.fn(),
  pathExists: vi.fn(),
}));

function makeSession() {
  let session = createDiscoverySession({
    id: 'session-1',
    clientId: 'client-a',
    projectId: 'project-a',
    projectType: 'เว็บขายของ',
    rawRequest: 'ต้องการเว็บขายของสำหรับขายสินค้าออนไลน์',
  });

  session = answerDiscoveryQuestion(session, 'ผู้ใช้งานมี admin และลูกค้าสมาชิก');
  session = answerDiscoveryQuestion(session, 'ฟีเจอร์หลักคือสินค้า ตะกร้า checkout สต็อก และรายงานยอดขาย');
  return session;
}

describe('createDiscoveryBriefFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a brief file in the project baseline folder', async () => {
    vi.mocked(tauriCommands.pathExists).mockResolvedValue(false);

    const result = await createDiscoveryBriefFile({
      session: makeSession(),
      clientId: 'client-a',
      projectId: 'project-a',
      projectPath: '/workspace/clients/client-a/projects/project-a',
    });

    expect(result.path).toBe('/workspace/clients/client-a/projects/project-a/baseline/brief-from-discovery.md');
    expect(result.markdown).toContain('type: brief');
    expect(tauriCommands.createDocument).toHaveBeenCalledWith(result.path, result.markdown);
  });

  it('uses a numbered filename when the default brief already exists', async () => {
    vi.mocked(tauriCommands.pathExists)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await createDiscoveryBriefFile({
      session: makeSession(),
      clientId: 'client-a',
      projectId: 'project-a',
      projectPath: '/workspace/clients/client-a/projects/project-a',
    });

    expect(result.path).toBe('/workspace/clients/client-a/projects/project-a/baseline/brief-from-discovery-2.md');
  });
});
