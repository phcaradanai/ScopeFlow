import type { CloseoutDeliveryStatusEntry } from './closeoutDeliveryStatus';
import type { CloseoutStatusSummary } from './closeoutStatus';

export type CloseoutFinalStatusKind = 'not_ready' | 'ready_to_deliver' | 'delivery_sent' | 'awaiting_customer_acceptance' | 'finalized';

export interface CloseoutFinalStatus {
  kind: CloseoutFinalStatusKind;
  label: string;
  description: string;
  is_terminal_ready: boolean;
}

export function getCloseoutFinalStatus(status: CloseoutStatusSummary, deliveryStatus?: CloseoutDeliveryStatusEntry): CloseoutFinalStatus {
  if (deliveryStatus?.status === 'acceptance_received') {
    return {
      kind: 'finalized',
      label: 'Finalized / Closed',
      description: 'ลูกค้ารับรองแล้ว งานนี้ปิดได้เป็น final close',
      is_terminal_ready: true,
    };
  }

  if (deliveryStatus?.status === 'pending_customer_acceptance') {
    return {
      kind: 'awaiting_customer_acceptance',
      label: 'Awaiting Acceptance',
      description: 'ส่ง package แล้ว และกำลังรอ customer acceptance / final sign-off',
      is_terminal_ready: true,
    };
  }

  if (deliveryStatus?.status === 'package_sent') {
    return {
      kind: 'delivery_sent',
      label: 'Delivery Sent',
      description: 'ส่ง closeout package แล้ว ควรติดตามผลรับรองจากลูกค้า',
      is_terminal_ready: true,
    };
  }

  if (status.export_ready) {
    return {
      kind: 'ready_to_deliver',
      label: 'Ready to Deliver',
      description: 'Package พร้อมส่งต่อแล้ว ให้เปิด Export Folder และ mark delivery status',
      is_terminal_ready: false,
    };
  }

  return {
    kind: 'not_ready',
    label: 'Not Ready',
    description: 'ยังต้องสร้าง Closeout Pack และ Export Index ให้ครบก่อนปิดงาน',
    is_terminal_ready: false,
  };
}
