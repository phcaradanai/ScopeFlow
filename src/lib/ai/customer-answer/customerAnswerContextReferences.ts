import type { LifecycleScanFile } from '../document-lifecycle/documentLifecycleFileScan';

export interface CustomerAnswerContextReference {
  id: 'scope_baseline' | 'approved_quotation' | 'recommended_cr_dcr';
  label: string;
  sourcePath?: string;
  actionLabel: string;
  status: 'available' | 'missing' | 'recommended';
}

function normalize(path: string): string {
  return path.toLowerCase().replace(/\\/g, '/');
}

function newestByPath(files: LifecycleScanFile[]): LifecycleScanFile | undefined {
  return [...files].sort((a, b) => normalize(b.path).localeCompare(normalize(a.path)))[0];
}

function findFile(files: LifecycleScanFile[], predicate: (path: string, markdown: string) => boolean): LifecycleScanFile | undefined {
  return newestByPath(files.filter(file => predicate(normalize(file.path), file.markdown.toLowerCase())));
}

export function getCustomerAnswerContextReferences(files: LifecycleScanFile[]): CustomerAnswerContextReference[] {
  const scopeBaselineFile = findFile(files, path => path.includes('baseline') && path.includes('scope'));
  const approvedQuotationFile = findFile(files, (path, markdown) => {
    const looksLikeQuotation = path.includes('quotation') || path.includes('quote');
    const looksApproved = markdown.includes('approved') || markdown.includes('อนุมัติ') || markdown.includes('approve');
    return looksLikeQuotation && looksApproved;
  });

  return [
    {
      id: 'scope_baseline',
      label: 'Current Scope Baseline',
      sourcePath: scopeBaselineFile?.path,
      actionLabel: scopeBaselineFile ? 'Open Scope Baseline' : 'Scope Baseline not found yet',
      status: scopeBaselineFile ? 'available' : 'missing',
    },
    {
      id: 'approved_quotation',
      label: 'Current Approved Quotation',
      sourcePath: approvedQuotationFile?.path,
      actionLabel: approvedQuotationFile ? 'Open Approved Quotation' : 'Approved Quotation not found yet',
      status: approvedQuotationFile ? 'available' : 'missing',
    },
    {
      id: 'recommended_cr_dcr',
      label: 'Recommended CR/DCR',
      actionLabel: 'Prepare CR/DCR',
      status: 'recommended',
    },
  ];
}
