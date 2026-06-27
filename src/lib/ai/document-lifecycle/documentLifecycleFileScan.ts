import type { DocumentLifecycleInput } from './documentLifecycle';

export interface LifecycleScanFile {
  path: string;
  markdown: string;
}

function hasMarker(markdown: string, marker: string): boolean {
  return markdown.includes(marker);
}

function hasStatus(markdown: string, status: string): boolean {
  return markdown.includes(`Status: **${status}**`);
}

function pathIncludes(path: string, keyword: string): boolean {
  return path.toLowerCase().replace(/\\/g, '/').includes(keyword.toLowerCase());
}

function isBriefFile(file: LifecycleScanFile): boolean {
  return pathIncludes(file.path, 'brief') || file.markdown.includes('# Brief') || file.markdown.includes('## Brief');
}

function isScopeFile(file: LifecycleScanFile): boolean {
  return pathIncludes(file.path, 'scope') || file.markdown.includes('# Scope') || file.markdown.includes('## Scope');
}

function isQuotationFile(file: LifecycleScanFile): boolean {
  return pathIncludes(file.path, 'quotation') || pathIncludes(file.path, 'quote') || file.markdown.includes('## Quotation') || file.markdown.includes('# Quotation');
}

function isChangeRequestFile(file: LifecycleScanFile): boolean {
  return pathIncludes(file.path, 'changes/') || file.markdown.includes('## Change Request') || file.markdown.includes('## Change Request / DCR Draft');
}

function isAcceptanceFile(file: LifecycleScanFile): boolean {
  return pathIncludes(file.path, 'acceptance/') || file.markdown.includes('# Acceptance / Sign-off Artifact');
}

export function scanDocumentLifecycleFromFiles(files: LifecycleScanFile[]): DocumentLifecycleInput {
  const briefFiles = files.filter(isBriefFile);
  const scopeFiles = files.filter(isScopeFile);
  const quotationFiles = files.filter(isQuotationFile);
  const changeRequestFiles = files.filter(isChangeRequestFile);
  const acceptanceFiles = files.filter(isAcceptanceFile);

  const quotationApproved = quotationFiles.some(file =>
    hasMarker(file.markdown, '<!-- quotation-approval-lock:start -->') && hasStatus(file.markdown, 'approved')
  );

  const scopeBaselineReady = quotationFiles.some(file =>
    hasMarker(file.markdown, '<!-- scope-baseline-from-approved-quote:start -->') && hasStatus(file.markdown, 'baseline_ready')
  );

  const changeRequestApproved = changeRequestFiles.some(file =>
    hasMarker(file.markdown, '<!-- change-request-approval-lock:start -->') && hasStatus(file.markdown, 'approved')
  );

  const changeBaselineReady = changeRequestFiles.some(file =>
    hasMarker(file.markdown, '<!-- change-request-baseline:start -->') && hasStatus(file.markdown, 'baseline_ready')
  );

  const acceptanceReadyForSignoff = acceptanceFiles.some(file =>
    hasMarker(file.markdown, '<!-- acceptance-artifact:start -->') && hasStatus(file.markdown, 'ready_for_signoff')
  );

  const acceptanceSignedOff = acceptanceFiles.some(file =>
    hasMarker(file.markdown, '<!-- acceptance-artifact:start -->') && hasStatus(file.markdown, 'signed_off')
  );

  return {
    hasBrief: briefFiles.length > 0,
    hasScope: scopeFiles.length > 0,
    hasQuotation: quotationFiles.length > 0,
    quotationApproved,
    scopeBaselineReady,
    hasChangeRequest: changeRequestFiles.length > 0,
    changeRequestApproved,
    changeBaselineReady,
    acceptanceReadyForSignoff,
    acceptanceSignedOff,
  };
}
