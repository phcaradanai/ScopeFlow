import type { ProjectLifecyclePriorityCategory } from './documentLifecyclePriority';

export type ProjectLifecycleFilter = 'all' | ProjectLifecyclePriorityCategory;

export interface ProjectLifecycleEmptyGuidance {
  title: string;
  description: string;
  recommended_next_action: string;
}

export function getProjectLifecycleEmptyGuidance(filter: ProjectLifecycleFilter): ProjectLifecycleEmptyGuidance {
  if (filter === 'blocked') {
    return {
      title: 'ตอนนี้ไม่มี blocker สำคัญ',
      description: 'ไม่มี project ที่ถูกจัดอยู่ในกลุ่ม Blocked จาก lifecycle จริง',
      recommended_next_action: 'ไปดู Missing Docs หรือ Can Close เพื่อเดินงานต่อ',
    };
  }

  if (filter === 'missing_docs') {
    return {
      title: 'ตอนนี้ไม่มี project ที่เอกสารหลักขาด',
      description: 'ไม่มี project ในกลุ่ม Missing Docs จาก lifecycle จริง',
      recommended_next_action: 'ไปดู Needs Action หรือ Can Close เพื่อดูงานที่ต้องทำต่อ',
    };
  }

  if (filter === 'can_close') {
    return {
      title: 'ยังไม่มี project ที่พร้อมปิดงาน',
      description: 'ยังไม่มี project ที่ sign-off/acceptance ครบจนเป็น Can Close',
      recommended_next_action: 'ไปดู Action file ของ project ที่ยังไม่ complete เพื่อสร้าง approval หรือ acceptance ให้ครบ',
    };
  }

  if (filter === 'closeout_ready') {
    return {
      title: 'ยังไม่มี project ที่มี Closeout Pack ครบ',
      description: 'ยังไม่มี project ที่สร้าง closeout pack แล้วและพร้อมสร้าง export index',
      recommended_next_action: 'ไปดู Can Close แล้วสร้าง Closeout Pack ก่อน',
    };
  }

  if (filter === 'export_ready') {
    return {
      title: 'ยังไม่มี package ที่พร้อมส่งต่อ',
      description: 'ยังไม่มี project ที่มีทั้ง closeout pack และ exports/closeout-package-index.md',
      recommended_next_action: 'ไปดู Closeout Ready แล้วสร้าง Export Index',
    };
  }

  if (filter === 'needs_action') {
    return {
      title: 'ตอนนี้ไม่มี project ในกลุ่ม Needs Action',
      description: 'ไม่มี project ที่รอ next action แบบทั่วไปจาก lifecycle จริง',
      recommended_next_action: 'ไปดู Blocked, Missing Docs หรือ Can Close เพื่อจัดการงานเฉพาะกลุ่ม',
    };
  }

  return {
    title: 'ยังไม่มี project ที่ scan lifecycle ได้',
    description: 'Workspace นี้ยังไม่มี project ที่พบเอกสาร lifecycle จากไฟล์จริง',
    recommended_next_action: 'สร้าง project หรือเพิ่มเอกสาร brief/scope/quote/approval/acceptance ก่อน',
  };
}
