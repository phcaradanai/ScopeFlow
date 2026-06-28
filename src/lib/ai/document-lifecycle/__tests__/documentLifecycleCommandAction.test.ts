import { describe, expect, it } from 'vitest';
import { getLifecycleCommandAction } from '../documentLifecycleCommandAction';

describe('documentLifecycleCommandAction', () => {
  it('opens direct target files first', () => {
    const action = getLifecycleCommandAction({ file_path: '/project/baseline/scope-v1.0.md', label: 'เปิด Scope', reason: 'ตรวจ scope ก่อน' }, { hasBrief: true, hasScope: true });

    expect(action.kind).toBe('open_document');
    expect(action.file_path).toContain('scope-v1.0.md');
    expect(action.label).toBe('เปิด Scope');
  });

  it('starts brief intake when no core documents exist', () => {
    const action = getLifecycleCommandAction({ label: 'เปิด Project', reason: 'ยังไม่พบไฟล์เอกสารหลักที่ควรเปิดโดยตรง' }, {});

    expect(action.kind).toBe('start_brief_intake');
    expect(action.initial_type).toBe('brief');
  });

  it('creates scope when brief exists but scope is missing', () => {
    const action = getLifecycleCommandAction({ label: 'เปิด Project', reason: 'ยังไม่พบไฟล์ target' }, { hasBrief: true });

    expect(action.kind).toBe('create_document');
    expect(action.initial_type).toBe('scope');
  });

  it('creates quotation when scope exists but quotation is missing', () => {
    const action = getLifecycleCommandAction({ label: 'เปิด Project', reason: 'ยังไม่พบไฟล์ target' }, { hasBrief: true, hasScope: true });

    expect(action.kind).toBe('create_document');
    expect(action.initial_type).toBe('quotation');
  });

  it('creates acceptance instead of silently doing nothing after core docs exist', () => {
    const action = getLifecycleCommandAction({ label: 'เปิด Project', reason: 'ยังไม่พบไฟล์ target' }, { hasBrief: true, hasScope: true, hasQuotation: true, quotationApproved: true, scopeBaselineReady: true });

    expect(action.kind).toBe('create_document');
    expect(action.initial_type).toBe('acceptance');
  });
});
