import { describe, expect, it } from 'vitest';
import { buildDocumentLifecycleSummary, type DocumentLifecycleInput } from '../documentLifecycle';
import { getDocumentLifecycleActionTarget } from '../documentLifecycleAction';
import { getLifecycleCommandAction } from '../documentLifecycleCommandAction';
import { buildLifecycleExplanation } from '../lifecycleExplanation';
import type { LifecycleScanFile } from '../documentLifecycleFileScan';

function buildScenario(input: DocumentLifecycleInput, scanFiles: LifecycleScanFile[] = []) {
  const summary = buildDocumentLifecycleSummary(input);
  const actionTarget = getDocumentLifecycleActionTarget(scanFiles, input);
  const commandAction = getLifecycleCommandAction(actionTarget, input);
  const explanation = buildLifecycleExplanation(input, summary, scanFiles, actionTarget);
  return { summary, actionTarget, commandAction, explanation };
}

function firstMissingSourcePathFor(labelIncludes: string, input: DocumentLifecycleInput, scanFiles: LifecycleScanFile[] = []) {
  const { explanation } = buildScenario(input, scanFiles);
  return explanation.missingDocuments.find(item => item.label.includes(labelIncludes))?.sourcePath;
}

describe('lifecycle command regression suite', () => {
  it('keeps approved quotation as the command target and explanation source for missing Scope Baseline', () => {
    const quotePath = '/workspace/clients/acme/projects/shop/quotation/quote-approved.md';
    const input: DocumentLifecycleInput = {
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: false,
    };
    const files: LifecycleScanFile[] = [{ path: quotePath, markdown: '# Quote\nApproved: yes' }];

    const { actionTarget, commandAction } = buildScenario(input, files);

    expect(actionTarget.file_path).toBe(quotePath);
    expect(commandAction.kind).toBe('open_document');
    expect(commandAction.file_path).toBe(quotePath);
    expect(firstMissingSourcePathFor('Scope Baseline', input, files)).toBe(quotePath);
  });

  it('keeps approved CR/DCR as the command target and explanation source for missing Change Baseline', () => {
    const crPath = '/workspace/clients/acme/projects/shop/changes/cr-approved.md';
    const input: DocumentLifecycleInput = {
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      hasChangeRequest: true,
      changeRequestApproved: true,
      changeBaselineReady: false,
    };
    const files: LifecycleScanFile[] = [{ path: crPath, markdown: '# CR\nApproved: yes' }];

    const { actionTarget, commandAction } = buildScenario(input, files);

    expect(actionTarget.file_path).toBe(crPath);
    expect(commandAction.kind).toBe('open_document');
    expect(commandAction.file_path).toBe(crPath);
    expect(firstMissingSourcePathFor('Change Baseline', input, files)).toBe(crPath);
  });

  it('keeps ready acceptance as the command target and explanation source for missing Sign-off', () => {
    const acceptancePath = '/workspace/clients/acme/projects/shop/acceptance/acceptance.md';
    const input: DocumentLifecycleInput = {
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      acceptanceReadyForSignoff: true,
      acceptanceSignedOff: false,
    };
    const files: LifecycleScanFile[] = [{ path: acceptancePath, markdown: '# Acceptance\nReady for signoff' }];

    const { actionTarget, commandAction } = buildScenario(input, files);

    expect(actionTarget.file_path).toBe(acceptancePath);
    expect(commandAction.kind).toBe('open_document');
    expect(commandAction.file_path).toBe(acceptancePath);
    expect(firstMissingSourcePathFor('Acceptance Sign-off', input, files)).toBe(acceptancePath);
  });

  it('falls back to creating Scope when Brief exists but no Scope target exists', () => {
    const input: DocumentLifecycleInput = { hasBrief: true, hasScope: false };
    const { actionTarget, commandAction, explanation } = buildScenario(input);

    expect(actionTarget.file_path).toBeUndefined();
    expect(commandAction.kind).toBe('create_document');
    expect(commandAction.initial_type).toBe('scope');
    expect(explanation.missingDocuments.map(item => item.label)).toContain('Scope (ขอบเขตงานโดยละเอียด)');
  });

  it('does not silently open the project when Acceptance should be created', () => {
    const input: DocumentLifecycleInput = {
      hasBrief: true,
      hasScope: true,
      hasQuotation: true,
      quotationApproved: true,
      scopeBaselineReady: true,
      acceptanceReadyForSignoff: false,
      acceptanceSignedOff: false,
    };
    const { actionTarget, commandAction, explanation } = buildScenario(input);

    expect(actionTarget.file_path).toBeUndefined();
    expect(commandAction.kind).toBe('create_document');
    expect(commandAction.initial_type).toBe('acceptance');
    expect(explanation.missingDocuments.map(item => item.label)).toContain('Acceptance (ใบตรวจรับที่เตรียมเสร็จสมบูรณ์)');
  });
});
