export type CloseoutDeliveryStatusType = 'package_sent' | 'pending_customer_acceptance' | 'acceptance_received';

export interface CloseoutDeliveryStatusEntry {
  project_path: string;
  status: CloseoutDeliveryStatusType;
  updated_at: string;
}

const DELIVERY_STATUS_PREFIX = 'scopeflow:closeout_delivery_status:';
const DELIVERY_STATUS_TYPES: CloseoutDeliveryStatusType[] = ['package_sent', 'pending_customer_acceptance', 'acceptance_received'];

export function getCloseoutDeliveryStatusStorageKey(workspacePath: string): string {
  return `${DELIVERY_STATUS_PREFIX}${workspacePath}`;
}

function isDeliveryStatusEntry(value: unknown): value is CloseoutDeliveryStatusEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<CloseoutDeliveryStatusEntry>;
  return (
    typeof entry.project_path === 'string' &&
    typeof entry.updated_at === 'string' &&
    typeof entry.status === 'string' &&
    DELIVERY_STATUS_TYPES.includes(entry.status as CloseoutDeliveryStatusType)
  );
}

export function parseCloseoutDeliveryStatuses(raw: string | null): CloseoutDeliveryStatusEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDeliveryStatusEntry);
  } catch {
    return [];
  }
}

export function serializeCloseoutDeliveryStatuses(entries: CloseoutDeliveryStatusEntry[]): string {
  return JSON.stringify(entries);
}

export function setCloseoutDeliveryStatus(entries: CloseoutDeliveryStatusEntry[], projectPath: string, status: CloseoutDeliveryStatusType, updatedAt = new Date().toISOString()): CloseoutDeliveryStatusEntry[] {
  const nextEntry: CloseoutDeliveryStatusEntry = {
    project_path: projectPath,
    status,
    updated_at: updatedAt,
  };
  return [nextEntry, ...entries.filter(entry => entry.project_path !== projectPath)];
}

export function getCloseoutDeliveryStatus(entries: CloseoutDeliveryStatusEntry[], projectPath: string): CloseoutDeliveryStatusEntry | undefined {
  return entries.find(entry => entry.project_path === projectPath);
}

export function formatCloseoutDeliveryStatusLabel(status: CloseoutDeliveryStatusType): string {
  if (status === 'package_sent') return 'Package sent';
  if (status === 'pending_customer_acceptance') return 'Pending customer acceptance';
  return 'Acceptance received';
}
