/**
 * Get the next revision filename based on conventions.
 * Minor bumps for scope, quotation, acceptance (e.g., -v1.0.md -> -v1.1.md)
 * Appends -rev1 for CR, DCR, SUP, MA (e.g., CR-001.md -> CR-001-rev1.md)
 */
export function getNextRevisionFilename(currentFilename: string, majorBump: boolean = false): string {
  // Pattern for vX.Y.md (e.g. scope-v1.0.md)
  const vPattern = /-v(\d+)\.(\d+)\.md$/;
  const vMatch = currentFilename.match(vPattern);
  
  if (vMatch) {
    const major = parseInt(vMatch[1], 10);
    const minor = parseInt(vMatch[2], 10);
    
    let newMajor = major;
    let newMinor = minor;
    
    if (majorBump) {
      newMajor += 1;
      newMinor = 0;
    } else {
      newMinor += 1;
    }
    
    return currentFilename.replace(vPattern, `-v${newMajor}.${newMinor}.md`);
  }

  // Pattern for revX.md (e.g. CR-001-add-sales-report-rev1.md)
  const revPattern = /-rev(\d+)\.md$/;
  const revMatch = currentFilename.match(revPattern);
  
  if (revMatch) {
    const rev = parseInt(revMatch[1], 10);
    return currentFilename.replace(revPattern, `-rev${rev + 1}.md`);
  }

  // No rev yet, append -rev1
  return currentFilename.replace(/\.md$/, '-rev1.md');
}

/**
 * Generate a new revision from an existing document content.
 * Resets status to draft, clears approval fields, clears lock, sets previous_version.
 */
export function generateRevisionDocument(
  originalContent: string,
  previousFilename: string,
  todayStr: string
): string {
  let inFrontmatter = false;
  const lines = originalContent.split('\n');
  const output: string[] = [];
  
  let hasPreviousVersion = false;
  let hasUpdated = false;
  let hasCreated = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === '---') {
      if (!inFrontmatter && i === 0) {
        inFrontmatter = true;
        output.push(line);
      } else if (inFrontmatter) {
        // End of frontmatter, inject fields if missing
        if (!hasPreviousVersion) output.push(`previous_version: "${previousFilename}"`);
        if (!hasCreated) output.push(`created: "${todayStr}"`);
        if (!hasUpdated) output.push(`updated: "${todayStr}"`);
        inFrontmatter = false;
        output.push(line);
      } else {
        output.push(line);
      }
      continue;
    }

    if (inFrontmatter) {
      if (line.startsWith('status:')) {
        output.push(`status: "draft"`);
      } else if (line.startsWith('locked:')) {
        output.push(`locked: false`);
      } else if (line.startsWith('locked_date:')) {
        // Drop or set empty
      } else if (line.startsWith('approved_by:')) {
        output.push(`approved_by: ""`);
      } else if (line.startsWith('approved_date:')) {
        output.push(`approved_date: ""`);
      } else if (line.startsWith('approval_ref:')) {
        output.push(`approval_ref: ""`);
      } else if (line.startsWith('previous_version:')) {
        output.push(`previous_version: "${previousFilename}"`);
        hasPreviousVersion = true;
      } else if (line.startsWith('updated:')) {
        output.push(`updated: "${todayStr}"`);
        hasUpdated = true;
      } else if (line.startsWith('created:')) {
        output.push(`created: "${todayStr}"`);
        hasCreated = true;
      } else {
        output.push(line);
      }
    } else {
      output.push(line);
    }
  }

  return output.join('\n');
}
