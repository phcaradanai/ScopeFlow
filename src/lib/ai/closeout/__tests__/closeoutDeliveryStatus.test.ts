import { describe, expect, it } from 'vitest';
import {
  formatCloseoutDeliveryStatusLabel,
  getCloseoutDeliveryStatus,
  getCloseoutDeliveryStatusStorageKey,
  parseCloseoutDeliveryStatuses,
  serializeCloseoutDeliveryStatuses,
  setCloseoutDeliveryStatus,
} from '../closeoutDeliveryStatus';

const workspacePath = '/workspace';
const projectPath = '/workspace/clients/acme/projects/crm-revamp';

describe('closeoutDeliveryStatus', () => {
  it('creates a workspace-scoped storage key', () => {
    expect(getCloseoutDeliveryStatusStorageKey(workspacePath)).toBe('scopeflow:closeout_delivery_status:/workspace');
  });

  it('serializes and parses delivery statuses', () => {
    const entries = setCloseoutDeliveryStatus([], projectPath, 'package_sent', '2026-01-01T00:00:00.000Z');
    const parsed = parseCloseoutDeliveryStatuses(serializeCloseoutDeliveryStatuses(entries));

    expect(parsed).toEqual(entries);
  });

  it('returns empty array for malformed storage payloads', () => {
    expect(parseCloseoutDeliveryStatuses(null)).toEqual([]);
    expect(parseCloseoutDeliveryStatuses('not-json')).toEqual([]);
    expect(parseCloseoutDeliveryStatuses('{"bad":true}')).toEqual([]);
  });

  it('filters malformed entries', () => {
    const parsed = parseCloseoutDeliveryStatuses(JSON.stringify([
      { project_path: projectPath, status: 'package_sent', updated_at: '2026-01-01T00:00:00.000Z' },
      { project_path: projectPath, status: 'invalid', updated_at: '2026-01-01T00:00:00.000Z' },
      { status: 'package_sent' },
    ]));

    expect(parsed).toHaveLength(1);
    expect(parsed[0].status).toBe('package_sent');
  });

  it('sets only the latest status per project', () => {
    const sent = setCloseoutDeliveryStatus([], projectPath, 'package_sent', '2026-01-01T00:00:00.000Z');
    const pending = setCloseoutDeliveryStatus(sent, projectPath, 'pending_customer_acceptance', '2026-01-02T00:00:00.000Z');

    expect(pending).toHaveLength(1);
    expect(getCloseoutDeliveryStatus(pending, projectPath)?.status).toBe('pending_customer_acceptance');
  });

  it('formats user-facing labels', () => {
    expect(formatCloseoutDeliveryStatusLabel('package_sent')).toBe('Package sent');
    expect(formatCloseoutDeliveryStatusLabel('pending_customer_acceptance')).toBe('Pending customer acceptance');
  });
});
