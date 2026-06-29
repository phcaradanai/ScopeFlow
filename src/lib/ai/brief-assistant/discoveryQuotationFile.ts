import { createDocument, pathExists } from '../../tauri-commands';
import type { DiscoverySession } from './discoverySession';
import { buildDiscoveryQuotationMarkdown } from './discoveryQuotationDraft';

export interface CreateDiscoveryQuotationFileInput {
  session: DiscoverySession;
  clientId: string;
  projectId: string;
  projectPath: string;
}

export interface CreateDiscoveryQuotationFileResult {
  path: string;
  markdown: string;
}

async function resolveQuotationPath(projectPath: string): Promise<string> {
  const basePath = `${projectPath}/baseline`;
  const candidates = [
    `${basePath}/quotation-from-discovery.md`,
    ...Array.from({ length: 9 }, (_, index) => `${basePath}/quotation-from-discovery-${index + 2}.md`),
  ];

  for (const candidate of candidates) {
    const exists = await pathExists(candidate);
    if (!exists) return candidate;
  }

  throw new Error('ไม่สามารถสร้าง Quotation ได้ เพราะมีไฟล์ quotation-from-discovery หลายเวอร์ชันแล้ว กรุณาตรวจสอบ baseline folder');
}

export async function createDiscoveryQuotationFile(input: CreateDiscoveryQuotationFileInput): Promise<CreateDiscoveryQuotationFileResult> {
  if (!input.projectPath || !input.projectId) {
    throw new Error('ต้องมี Project ก่อนจึงจะสร้าง Quotation file จาก Discovery Session ได้');
  }

  const path = await resolveQuotationPath(input.projectPath);
  const markdown = buildDiscoveryQuotationMarkdown(input.session, input.clientId, input.projectId);
  await createDocument(path, markdown);

  return { path, markdown };
}
