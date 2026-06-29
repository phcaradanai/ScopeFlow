import { beforeEach, describe, expect, it, vi } from 'vitest';
import { answerDiscoveryQuestion, createDiscoverySession } from '../discoverySession';
import { buildDiscoveryQuotationFormData, buildDiscoveryQuotationMarkdown } from '../discoveryQuotationDraft';
import { createDiscoveryQuotationFile } from '../discoveryQuotationFile';
import { createDocument, pathExists } from '../../../tauri-commands';

vi.mock('../../../tauri-commands', () => ({
  createDocument: vi.fn().mockResolvedValue(undefined),
  pathExists: vi.fn().mockResolvedValue(false),
}));

function createQuotationReadySession() {
  let session = createDiscoverySession({
    id: 'session-quote-1',
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
  session = answerDiscoveryQuestion(session, 'มีงบ 100000 บาท ภายใน 1 เดือน');
  session = answerDiscoveryQuestion(session, 'ตรวจรับเมื่อสั่งซื้อและรายงานยอดขายใช้งานได้');

  return session;
}

describe('discoveryQuotationDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pathExists).mockResolvedValue(false);
    vi.mocked(createDocument).mockResolvedValue(undefined);
  });

  it('builds quotation form data from discovery answers and budget', () => {
    const session = createQuotationReadySession();
    const formData = buildDiscoveryQuotationFormData(session, 'project-a');

    expect(formData.title).toBe('ใบเสนอราคาจาก Discovery: project-a');
    expect(formData.scope_ref).toBe('scope-from-discovery.md');
    expect(formData.line_items).toHaveLength(3);
    expect(formData.line_items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)).toBe(100000);
    expect(formData.notes).toContain('Discovery Session session-quote-1');
  });

  it('generates quotation markdown with quotation frontmatter and totals', () => {
    const session = createQuotationReadySession();
    const markdown = buildDiscoveryQuotationMarkdown(session, 'client-a', 'project-a');

    expect(markdown).toContain('type: quotation');
    expect(markdown).toContain('# ใบเสนอราคาจาก Discovery: project-a');
    expect(markdown).toContain('100,000.00');
    expect(markdown).toContain('107,000.00');
  });

  it('writes quotation markdown to the first available baseline path', async () => {
    const session = createQuotationReadySession();
    const result = await createDiscoveryQuotationFile({
      session,
      clientId: 'client-a',
      projectId: 'project-a',
      projectPath: '/workspace/clients/client-a/projects/project-a',
    });

    expect(result.path).toBe('/workspace/clients/client-a/projects/project-a/baseline/quotation-from-discovery.md');
    expect(createDocument).toHaveBeenCalledWith(result.path, expect.stringContaining('type: quotation'));
  });
});
