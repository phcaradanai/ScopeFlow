import type { CloseoutStatusSummary } from './closeoutStatus';

export interface CloseoutDeliveryChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface CloseoutDeliveryChecklist {
  ready_for_delivery: boolean;
  title: string;
  description: string;
  items: CloseoutDeliveryChecklistItem[];
}

export function getCloseoutDeliveryChecklist(status: CloseoutStatusSummary): CloseoutDeliveryChecklist {
  const exportReady = status.export_ready;
  return {
    ready_for_delivery: exportReady,
    title: exportReady ? 'Export Ready checklist' : 'Delivery checklist locked',
    description: exportReady
      ? 'ตรวจขั้นส่งมอบจริงหลังสร้าง closeout package แล้ว'
      : 'สร้าง Closeout Pack และ Export Index ให้ครบก่อนเข้าสู่ขั้นส่งมอบจริง',
    items: [
      {
        id: 'open_export_folder',
        label: 'เปิด Export Folder และตรวจไฟล์ส่งมอบ',
        done: exportReady,
      },
      {
        id: 'review_package_index',
        label: 'ตรวจ closeout-package-index.md ก่อนส่งต่อ',
        done: exportReady,
      },
      {
        id: 'attach_package_to_customer_message',
        label: 'แนบ package หรือ export folder ส่งลูกค้า/ทีม',
        done: false,
      },
      {
        id: 'record_delivery_or_pending_acceptance',
        label: 'บันทึกว่าส่งแล้ว หรือ pending customer acceptance',
        done: false,
      },
    ],
  };
}
