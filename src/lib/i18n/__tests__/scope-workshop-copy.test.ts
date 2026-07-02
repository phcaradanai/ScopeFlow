import { describe, it, expect } from 'vitest';
import { copy, DEFAULT_LOCALE } from '../copy';

describe('Scope Workshop i18n copy', () => {
  it('should have Thai copy for Scope Workshop', () => {
    const thCopy = copy[DEFAULT_LOCALE].scopeWorkshop as any;
    expect(thCopy).toBeDefined();
    expect(thCopy.title).toBe('ห้องทำ Scope');
    expect(thCopy.pasteCustomerMessage).toBe('วางข้อความจากลูกค้า');
    expect(thCopy.analyzeBriefScope).toBe('วิเคราะห์ Brief/Scope');
    expect(thCopy.currentBrief).toBe('Brief ปัจจุบัน');
    expect(thCopy.latestScope).toBe('Scope ปัจจุบัน');
    expect(thCopy.whatChanged).toBe('สิ่งที่เปลี่ยน');
    expect(thCopy.missingInfo).toBe('สิ่งที่ยังไม่ชัด');
    expect(thCopy.followUpQuestions).toBe('คำถามที่ควรถามเพิ่ม');
    expect(thCopy.updateBrief).toBe('อัปเดต Brief');
    expect(thCopy.updateScope).toBe('อัปเดต Scope');
    expect(thCopy.createFollowUp).toBe('สร้าง Follow-up');
    expect(thCopy.createChangeRequest).toBe('สร้าง Change Request');
    expect(thCopy.acceptScope).toBe('ยอมรับ Scope นี้สำหรับการทำงาน');
    expect(thCopy.closeScopeLoop).toBe('ปิดรอบการทำ Scope');
  });

  it('should not contain technical terms in main Thai flow', () => {
    const thCopyString = JSON.stringify(copy[DEFAULT_LOCALE].scopeWorkshop);
    expect(thCopyString).not.toMatch(/file/i);
    expect(thCopyString).not.toMatch(/folder/i);
    expect(thCopyString).not.toMatch(/markdown/i);
    expect(thCopyString).not.toMatch(/slug/i);
    expect(thCopyString).not.toMatch(/provider/i);
    expect(thCopyString).not.toMatch(/fallback/i);
    expect(thCopyString).not.toMatch(/deterministic/i);
    expect(thCopyString).not.toMatch(/raw diff/i);
    expect(thCopyString).not.toMatch(/path/i);
  });
});
