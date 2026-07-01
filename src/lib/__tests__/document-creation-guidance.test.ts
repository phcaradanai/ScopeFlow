import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_CREATION_INTENTS,
  getDocumentCreationCta,
  getDocumentCreationIntent,
  getDocumentCreationIntentForType,
  getDocumentCreationRecommendationReason,
  getDocumentCreationResult,
} from '../document-creation-guidance';

describe('document creation guidance', () => {
  it('maps each guided intent to the document type ScopeFlow should create', () => {
    expect(getDocumentCreationIntent('define_scope')?.documentType).toBe('scope');
    expect(getDocumentCreationIntent('send_quote')?.documentType).toBe('quotation');
    expect(getDocumentCreationIntent('control_change')?.documentType).toBe('cr');
    expect(getDocumentCreationIntent('handle_support')?.documentType).toBe('sup');
    expect(getDocumentCreationIntent('prepare_acceptance')?.documentType).toBe('acceptance');
    expect(getDocumentCreationIntent('request_clarity')?.documentType).toBe('followup');
    expect(getDocumentCreationIntent('review_rejection')?.documentType).toBe('revision');
  });

  it('keeps advanced document types attached to the right friendly intent', () => {
    expect(getDocumentCreationIntentForType('dcr')?.id).toBe('control_change');
    expect(getDocumentCreationIntentForType('ma')?.id).toBe('handle_support');
    expect(getDocumentCreationCta('dcr')).toBe('สร้าง Change Request');
    expect(getDocumentCreationCta('invoice')).toBe('สร้าง Invoice');
  });

  it('explains the result and recommendation reason in user language', () => {
    expect(getDocumentCreationResult('scope')).toContain('ได้ Scope');
    expect(getDocumentCreationRecommendationReason('quotation')).toContain('เสนอราคา');
    expect(getDocumentCreationRecommendationReason('scope', 'Brief approved แล้ว')).toBe('Brief approved แล้ว');
  });

  it('covers the main guided flow without exposing manual-only choices as primary intents', () => {
    const primaryTypes = DOCUMENT_CREATION_INTENTS.map(intent => intent.documentType);

    expect(primaryTypes).toEqual(['scope', 'quotation', 'cr', 'sup', 'acceptance', 'followup', 'revision']);
    expect(primaryTypes).not.toContain('invoice');
    expect(primaryTypes).not.toContain('dcr');
    expect(primaryTypes).not.toContain('ma');
  });
});
