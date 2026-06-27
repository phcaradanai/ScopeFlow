import type { DocumentLifecycleInput } from './documentLifecycle';
import type { LifecycleScanFile } from './documentLifecycleFileScan';

export interface DocumentLifecycleActionTarget {
  file_path?: string;
  label: string;
  reason: string;
}

function normalize(path: string): string {
  return path.toLowerCase().replace(/\\/g, '/');
}

function newestByName(files: LifecycleScanFile[]): LifecycleScanFile | undefined {
  return [...files].sort((a, b) => normalize(b.path).localeCompare(normalize(a.path)))[0];
}

function findFile(files: LifecycleScanFile[], predicate: (path: string, markdown: string) => boolean): LifecycleScanFile | undefined {
  return newestByName(files.filter(file => predicate(normalize(file.path), file.markdown)));
}

export function getDocumentLifecycleActionTarget(files: LifecycleScanFile[], input: DocumentLifecycleInput): DocumentLifecycleActionTarget {
  const acceptanceFile = findFile(files, path => path.includes('/acceptance/') || path.includes('acceptance/'));
  const changeRequestFile = findFile(files, path => path.includes('/changes/') || path.includes('changes/') || path.includes('/change-requests/') || path.includes('change-requests/'));
  const quotationFile = findFile(files, path => path.includes('quotation') || path.includes('quote'));
  const scopeFile = findFile(files, path => path.includes('scope'));
  const briefFile = findFile(files, path => path.includes('brief'));

  if (input.acceptanceSignedOff && acceptanceFile) {
    return {
      file_path: acceptanceFile.path,
      label: 'เปิด Acceptance Sign-off',
      reason: 'งานปิดได้แล้ว ให้เปิด acceptance artifact เป็นหลักฐานปิดงาน',
    };
  }

  if (input.acceptanceReadyForSignoff && acceptanceFile) {
    return {
      file_path: acceptanceFile.path,
      label: 'เปิด Acceptance',
      reason: 'Acceptance พร้อมส่งให้ลูกค้า sign-off',
    };
  }

  if (input.changeRequestApproved && !input.changeBaselineReady && changeRequestFile) {
    return {
      file_path: changeRequestFile.path,
      label: 'เปิด CR/DCR',
      reason: 'CR/DCR approved แล้ว แต่ยังต้องล็อก Change Baseline',
    };
  }

  if (input.hasChangeRequest && !input.changeRequestApproved && changeRequestFile) {
    return {
      file_path: changeRequestFile.path,
      label: 'เปิด CR/DCR',
      reason: 'CR/DCR ยังรอ approval หรือยังไม่มีหลักฐานครบ',
    };
  }

  if (input.quotationApproved && !input.scopeBaselineReady && quotationFile) {
    return {
      file_path: quotationFile.path,
      label: 'เปิด Quotation',
      reason: 'Quotation approved แล้ว แต่ยังต้องสร้าง Scope Baseline',
    };
  }

  if (input.hasQuotation && !input.quotationApproved && quotationFile) {
    return {
      file_path: quotationFile.path,
      label: 'เปิด Quotation',
      reason: 'Quotation ยังไม่ approved หรือยังไม่มี approval lock',
    };
  }

  if (input.hasScope && scopeFile) {
    return {
      file_path: scopeFile.path,
      label: 'เปิด Scope',
      reason: 'ตรวจ scope ก่อนเดินงานต่อ',
    };
  }

  if (input.hasBrief && briefFile) {
    return {
      file_path: briefFile.path,
      label: 'เปิด Brief',
      reason: 'เริ่มจาก brief เพื่อทำ scope/quote ต่อ',
    };
  }

  return {
    label: 'เปิด Project',
    reason: 'ยังไม่พบไฟล์เอกสารหลักที่ควรเปิดโดยตรง',
  };
}
