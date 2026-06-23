import YAML from 'yaml';
import { readFileContent, FileEntry } from './tauri-commands';

export interface ProjectDocument {
  file_path: string;
  file_name: string;
  folder: string;
  type: string;
  title: string;
  status: string;
  version: string;
  locked: boolean;
  approved_by?: string;
  approved_date?: string;
  approval_ref?: string;
  approved_document?: string;
  evidence_files?: string[];
  previous_version?: string;
  created?: string;
  updated?: string;
  document_number?: string;
  excerpt: string;
  parse_status: 'success' | 'warning';
}

const ALLOWED_FOLDERS = [
  'baseline',
  'current-system',
  'change-requests',
  'support-requests',
  'approvals',
  'acceptance',
  'exports'
];

/**
 * Traverses a workspace tree to find a specific node by path.
 */
function findNodeByPath(node: FileEntry, targetPath: string): FileEntry | null {
  if (node.path === targetPath) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByPath(child, targetPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Extracts all matching files from a directory node.
 */
function extractFiles(node: FileEntry, projectPath: string, files: FileEntry[]) {
  if (!node) return;
  if (!node.is_dir) {
    const relativePath = node.path.substring(projectPath.length + 1);
    const folder = relativePath.split('/')[0];
    
    if (ALLOWED_FOLDERS.includes(folder)) {
      if (node.name.endsWith('.md') || (folder === 'exports' && node.name.endsWith('.html'))) {
        files.push(node);
      }
    }
  } else if (node.children) {
    node.children.forEach(c => extractFiles(c, projectPath, files));
  }
}

/**
 * Generates a plain text excerpt from markdown content
 */
function generateExcerpt(content: string, length = 150): string {
  // Strip frontmatter
  const noFrontmatter = content.replace(/^---[\s\S]*?---\n+/, '');
  
  // Very basic markdown stripping (remove hashes, stars, underscores, links, images, tables, html tags)
  const noMarkdown = noFrontmatter
    .replace(/#+\s+/g, '') // headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // images
    .replace(/[*_~`]/g, '') // bold/italic/strikethrough/code
    .replace(/<[^>]*>?/gm, '') // html tags
    .replace(/\|.*\|/g, '') // tables
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
    
  if (noMarkdown.length > length) {
    return noMarkdown.substring(0, length) + '...';
  }
  return noMarkdown;
}

export function extractDocumentMetadata(filePath: string, content: string, projectPath: string): ProjectDocument {
  const fileName = filePath.split('/').pop() || '';
  const relativePath = filePath.substring(projectPath.length + 1);
  const folder = relativePath.split('/')[0] || '';
  
  const excerpt = generateExcerpt(content);
  
  const defaultDoc: ProjectDocument = {
    file_path: filePath,
    file_name: fileName,
    folder,
    type: folder, // Default type based on folder
    title: fileName,
    status: 'draft',
    version: '1.0',
    locked: false,
    excerpt,
    parse_status: 'warning', // Warning by default if no frontmatter found
  };

  // If it's an export HTML file, don't parse YAML
  if (fileName.endsWith('.html')) {
    defaultDoc.type = 'export';
    defaultDoc.status = 'exported';
    defaultDoc.parse_status = 'success';
    return defaultDoc;
  }

  // Extract first H1 as fallback title
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]) {
    defaultDoc.title = h1Match[1].trim();
  }

  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n+/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return defaultDoc;
  }

  try {
    const yaml = YAML.parse(match[1]);
    
    return {
      file_path: filePath,
      file_name: fileName,
      folder,
      type: yaml.type || defaultDoc.type,
      title: yaml.title || defaultDoc.title,
      status: yaml.status || 'draft',
      version: yaml.version?.toString() || '1.0',
      locked: yaml.locked === true,
      approved_by: yaml.approved_by,
      approved_date: yaml.approved_date,
      approval_ref: yaml.approval_ref,
      approved_document: yaml.approved_document,
      evidence_files: yaml.evidence_files,
      previous_version: yaml.previous_version,
      created: yaml.created,
      updated: yaml.updated,
      document_number: yaml.document_number || yaml.id?.toString(),
      excerpt,
      parse_status: 'success'
    };
  } catch (err) {
    // Malformed YAML
    return defaultDoc;
  }
}

export async function scanProjectDocuments(projectPath: string, workspaceTree: FileEntry): Promise<ProjectDocument[]> {
  const projectNode = findNodeByPath(workspaceTree, projectPath);
  if (!projectNode) return [];

  const files: FileEntry[] = [];
  extractFiles(projectNode, projectPath, files);

  const results: ProjectDocument[] = [];
  
  for (const file of files) {
    try {
      const content = await readFileContent(file.path);
      const metadata = extractDocumentMetadata(file.path, content, projectPath);
      results.push(metadata);
    } catch (err) {
      console.error(`Failed to read or parse file ${file.path}:`, err);
    }
  }

  return results;
}
