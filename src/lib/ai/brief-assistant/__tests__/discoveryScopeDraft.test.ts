import { beforeEach, describe, expect, it, vi } from 'vitest';
import { answerDiscoveryQuestion, createDiscoverySession } from '../discoverySession';
import { buildDiscoveryScopeFormData, buildDiscoveryScopeMarkdown } from '../discoveryScopeDraft';
import { createDiscoveryScopeFile } from '../discoveryScopeFile';
import { createDocument, pathExists } from '../../../tauri-commands';

vi.mock('../../../tauri-commands', () => ({
  createDocument: vi.fn().mockResolvedValue(undefined),
  pathExists: vi.fn().mockResolvedValue(false),
}));

function createReadySession() {
  let session = createDiscoverySession({
    id: 'session-1',
    clientId: 'client-a',
    projectId: 'project-a',
    projectType: 'เว็บขายของ',
    rawRequest: 'ต้องการเว็บขายของสำหรับขายสินค้าออนไลน์',
  });

  session = answerDiscoveryQuestion(session, 'ผู้ใช้งานมี admin และลูกค้าสมาชิก');
  session = answerDiscoveryQuestion(session, 'ฟีเจอร์หลักคือสินค้า ตะกร้า checkout สต็อก และรายงานยอดขาย');
  session = answerDiscoveryQuestion(session, 'ใช้งานบน web browser ก่อน mobile app ยังไม่รวม');
  session = answerDiscoveryQuestion(session, 'ข้อมูลสินค้าเริ่มต้นมาจาก excel และรูปภาพลูกค้าเตรียมให้');
  session = answerDiscoveryQuestion(session, 'เชื่อม payment พร้อมเพย์และส่ง email แจ้งเตือน');
  session = answerDiscoveryQuestion(session, 'ตรวจรับเมื่อสั่งซื้อและรายงานยอดขายใช้งานได้');

  return session;
}

describe('discoveryScopeDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pathExists).mockResolvedValue(false);
    vi.mocked(createDocument).mockResolvedValue(undefined);
  });

  it('builds scope form data from discovery answers and readiness signals', () => {
    const session = createReadySession();
    const formData = buildDiscoveryScopeFormData(session, 'project-a');

    expect(formData.title).toBe('ขอบเขตงานจาก Discovery: project-a');
    expect(formData.project_overview).toContain('ต้องการเว็บขายของสำหรับขายสินค้าออนไลน์');
    expect(formData.project_overview).toContain('ผู้ใช้งานมี admin และลูกค้าสมาชิก');
    expect(formData.deliverables).toContain('Scope Draft จาก Discovery Session');
    expect(formData.assumptions).toContain('Discovery Session session-1');
  });

  it('generates scope markdown with scope frontmatter', () => {
    const session = createReadySession();
    const markdown = buildDiscoveryScopeMarkdown(session, 'project-a');

    expect(markdown).toContain('type: scope');
    expect(markdown).toContain('# ขอบเขตงานจาก Discovery: project-a');
    expect(markdown).toContain('## 2. ขอบเขตที่รวมอยู่ในโครงการ');
    expect(markdown).toContain('Scope Draft จาก Discovery Session');
  });

  it('writes scope markdown to the first available baseline path', async () => {
    const session = createReadySession();
    const result = await createDiscoveryScopeFile({
      session,
      projectId: 'project-a',
      projectPath: '/workspace/clients/client-a/projects/project-a',
    });

    expect(result.path).toBe('/workspace/clients/client-a/projects/project-a/baseline/scope-from-discovery.md');
    expect(createDocument).toHaveBeenCalledWith(result.path, expect.stringContaining('type: scope'));
  });
});
