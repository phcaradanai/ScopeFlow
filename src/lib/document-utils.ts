import { DocumentInfo } from './tauri-commands';

/**
 * Gets the next available number for a given document prefix (e.g., 'CR', 'DCR', 'SUP', 'MA').
 * Scans the provided list of documents to find the highest number and increments it by 1.
 * Returns a 3-digit zero-padded string (e.g., '001', '002').
 */
export function getNextDocumentNumber(documents: DocumentInfo[], prefix: string): string {
  let maxNumber = 0;
  
  // Pattern to match prefix-NNN-... e.g., CR-001-some-slug.md
  const pattern = new RegExp(`^${prefix}-(\\d+)-?`);

  for (const doc of documents) {
    const match = doc.filename.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNumber = maxNumber + 1;
  return nextNumber.toString().padStart(3, '0');
}

/**
 * Generates the expected file path relative to the project root based on document type.
 */
export function getDocumentFilePath(
  projectPath: string,
  type: string,
  slug: string,
  numberStr: string
): { filename: string; fullPath: string } {
  let filename = '';
  let folder = '';

  switch (type) {
    case 'scope':
      filename = 'scope-v1.0.md';
      folder = 'baseline';
      break;
    case 'quotation':
      filename = 'quotation-v1.0.md';
      folder = 'baseline';
      break;
    case 'cr':
      filename = `CR-${numberStr}-${slug}.md`;
      folder = 'change-requests';
      break;
    case 'dcr':
      filename = `DCR-${numberStr}-${slug}.md`;
      folder = 'change-requests';
      break;
    case 'sup':
      filename = `SUP-${numberStr}-${slug}.md`;
      folder = 'support-requests';
      break;
    case 'ma':
      filename = `MA-${numberStr}-${slug}.md`;
      folder = 'support-requests';
      break;
    case 'acceptance':
      filename = 'acceptance-checklist-v1.0.md';
      folder = 'acceptance';
      break;
    default:
      filename = `unknown-${slug}.md`;
      folder = 'misc';
  }

  return {
    filename,
    fullPath: `${projectPath}/${folder}/${filename}`,
  };
}
