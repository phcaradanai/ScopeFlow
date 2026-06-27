import type { CloseoutLatestReopenDecisionSummary } from './closeoutReopenDecisionDetection';

export interface CloseoutReopenSelectedDecisionGuidance {
  has_guidance: boolean;
  title: string;
  description: string;
  recommended_next_action: string;
}

const FALLBACK_GUIDANCE: CloseoutReopenSelectedDecisionGuidance = {
  has_guidance: false,
  title: 'No selected reopen decision',
  description: 'ยังไม่มี decision ที่เลือกชัดเจนสำหรับ Reopen / CR นี้',
  recommended_next_action: 'เลือก decision หนึ่งข้อใน reopen-request ก่อนเริ่มงานต่อ',
};

export function getCloseoutReopenSelectedDecisionGuidance(decision: CloseoutLatestReopenDecisionSummary): CloseoutReopenSelectedDecisionGuidance {
  if (!decision.has_reopen_request || !decision.has_decision || !decision.selected_decision_id) return FALLBACK_GUIDANCE;

  if (decision.selected_decision_id === 'reject_request') {
    return {
      has_guidance: true,
      title: 'Prepare rejection response / out-of-scope note',
      description: 'คำขอนี้ควรถูกปฏิเสธหรือระบุว่าอยู่นอก scope หลังปิดงานแล้ว',
      recommended_next_action: 'เขียนเหตุผลปฏิเสธให้ชัด อ้างอิง accepted baseline และระบุว่าหากต้องทำต่อควรเปิด CR ใหม่',
    };
  }

  if (decision.selected_decision_id === 'quote_change_request') {
    return {
      has_guidance: true,
      title: 'Prepare CR quotation / change scope',
      description: 'คำขอนี้ควรถูกจัดเป็น Change Request ที่ต้องประเมิน scope และราคาใหม่',
      recommended_next_action: 'สร้างรายการงานเพิ่ม ขอบเขตใหม่ ราคา/เวลา และเงื่อนไข approval ก่อนเริ่มทำงาน',
    };
  }

  if (decision.selected_decision_id === 'create_new_scope') {
    return {
      has_guidance: true,
      title: 'Create new brief/scope baseline',
      description: 'คำขอนี้ควรแยกเป็น scope ใหม่ ไม่ปนกับ baseline ที่ปิดแล้ว',
      recommended_next_action: 'เริ่ม brief/scope ใหม่โดยอ้างอิงงานเดิมเป็น background แต่สร้าง baseline ใหม่สำหรับงานถัดไป',
    };
  }

  if (decision.selected_decision_id === 'need_more_information') {
    return {
      has_guidance: true,
      title: 'Prepare customer questions',
      description: 'ยังตัดสินใจไม่ได้จนกว่าจะถามข้อมูลเพิ่มจากลูกค้า',
      recommended_next_action: 'เขียนคำถามที่ต้องตอบก่อนประเมินว่าเป็น reject, CR, หรือ scope ใหม่',
    };
  }

  return FALLBACK_GUIDANCE;
}
