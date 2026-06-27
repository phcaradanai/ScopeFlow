import type { CloseoutReopenRequestSummary } from './closeoutReopenDetection';

export interface CloseoutReopenActionPlanItem {
  id: string;
  label: string;
  description: string;
}

export interface CloseoutReopenActionPlan {
  has_action_plan: boolean;
  title: string;
  summary: string;
  items: CloseoutReopenActionPlanItem[];
}

export function getCloseoutReopenActionPlan(summary: CloseoutReopenRequestSummary): CloseoutReopenActionPlan {
  if (!summary.has_reopen_request) {
    return {
      has_action_plan: false,
      title: 'No reopen request',
      summary: 'ยังไม่พบ Reopen / CR หลังปิดงาน',
      items: [],
    };
  }

  return {
    has_action_plan: true,
    title: 'Reopen / CR action plan',
    summary: 'พบ request หลังปิดงานแล้ว ให้ควบคุมเป็น CR หรือ scope ใหม่ ไม่แก้ baseline เดิมแบบเงียบ ๆ',
    items: [
      {
        id: 'review_request',
        label: 'Review reopen request',
        description: 'อ่านเหตุผลและหลักฐานใน reopen-request ล่าสุดก่อนตอบลูกค้า',
      },
      {
        id: 'decide_response',
        label: 'Decide: reject / quote CR / create new scope',
        description: 'ตัดสินใจว่าจะปฏิเสธ, ออกใบเสนอราคา CR, หรือเปิด scope ใหม่',
      },
      {
        id: 'protect_baseline',
        label: 'Protect accepted baseline',
        description: 'อย่าแก้ไฟล์ที่เป็น accepted/finalized baseline โดยไม่สร้าง CR trace',
      },
    ],
  };
}
