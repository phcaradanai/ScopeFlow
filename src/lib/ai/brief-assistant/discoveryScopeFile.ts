import { createDocument, pathExists } from '../../tauri-commands';
import type { DiscoverySession } from './discoverySession';
import { buildDiscoveryScopeMarkdown } from './discoveryScopeDraft';

export interface CreateDiscoveryScopeFileInput {
  session: DiscoverySession;
  projectId: string;
  projectPath: string;
}

export interface CreateDiscoveryScopeFileResult {
  path: string;
  markdown: string;
}

async function resolveScopePath(projectPath: string): Promise<string> {
  const basePath = `${projectPath}/baseline`;
  const candidates = [
    `${basePath}/scope-from-discovery.md`,
    ...Array.from({ length: 9 }, (_, index) => `${basePath}/scope-from-discovery-${index + 2}.md`),
  ];

  for (const candidate of candidates) {
    const exists = await pathExists(candidate);
    if (!exists) return candidate;
  }

  throw new Error('ไม่สามารถสร้าง Scope ได้ เพราะมีไฟล์ scope-from-discovery หลายเวอร์ชันแล้ว กรุณาตรวจสอบ baseline folder');
}

export async function createDiscoveryScopeFile(input: CreateDiscoveryScopeFileInput): Promise<CreateDiscoveryScopeFileResult> {
  if (!input.projectPath || !input.projectId) {
    throw new Error('ต้องมี Project ก่อนจึงจะสร้าง Scope file จาก Discovery Session ได้');
  }

  const path = await resolveScopePath(input.projectPath);
  const markdown = buildDiscoveryScopeMarkdown(input.session, input.projectId);
  await createDocument(path, markdown);

  return { path, markdown };
}
