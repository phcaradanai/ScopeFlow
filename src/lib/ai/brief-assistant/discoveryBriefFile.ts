import { createDocument, pathExists } from '../../tauri-commands';
import type { DiscoverySession } from './discoverySession';
import { buildDiscoveryBriefMarkdown } from './discoveryBriefDraft';

export interface CreateDiscoveryBriefFileInput {
  session: DiscoverySession;
  clientId: string;
  projectId: string;
  projectPath: string;
}

export interface CreateDiscoveryBriefFileResult {
  path: string;
  markdown: string;
}

async function resolveBriefPath(projectPath: string): Promise<string> {
  const basePath = `${projectPath}/baseline`;
  const candidates = [
    `${basePath}/brief-from-discovery.md`,
    ...Array.from({ length: 9 }, (_, index) => `${basePath}/brief-from-discovery-${index + 2}.md`),
  ];

  for (const candidate of candidates) {
    const exists = await pathExists(candidate);
    if (!exists) return candidate;
  }

  throw new Error('ไม่สามารถสร้าง Brief ได้ เพราะมีไฟล์ brief-from-discovery หลายเวอร์ชันแล้ว กรุณาตรวจสอบ baseline folder');
}

export async function createDiscoveryBriefFile(input: CreateDiscoveryBriefFileInput): Promise<CreateDiscoveryBriefFileResult> {
  if (!input.projectPath || !input.projectId) {
    throw new Error('ต้องมี Project ก่อนจึงจะสร้าง Brief file จาก Discovery Session ได้');
  }

  const path = await resolveBriefPath(input.projectPath);
  const markdown = buildDiscoveryBriefMarkdown(input.session, input.clientId, input.projectId);
  await createDocument(path, markdown);

  return { path, markdown };
}
