# ScopeFlow Stabilization V1 — Real User Flow Scenario

เป้าหมายของรอบนี้คือเช็คว่า Guided Operating Mode V1–V1.7 ใช้งานต่อเนื่องได้จริง ไม่ใช่แค่ feature ครบ

## Flow ที่ต้องไล่ทดสอบด้วยมือ

### 1. สร้าง Project ใหม่
- สร้าง client/project ใหม่
- เปิด Project Overview
- ควรเห็น Guided Operating Mode เป็น hero หลัก
- Project Readiness Gate ควรบอกว่า `พร้อมทำ Brief`
- CTA หลักควรเป็น `เริ่มจากคำขอลูกค้า`

### 2. เริ่มจากคำขอลูกค้า
- กด `เริ่มจากคำขอลูกค้า`
- วางคำขอลูกค้าที่คลุมเครือ เช่น ต้องการระบบจองคิวให้เร็ว ๆ รองรับทั้งหมด
- ระบบควรพาไปสร้าง/สรุป Brief หรือถามข้อมูลที่ขาด
- Copy ควรเป็นภาษางานจริง ไม่ใช้คำ technical เป็นหลัก

### 3. สร้าง Brief
- หลังมี Brief แล้ว Project Readiness Gate ควรเปลี่ยนเป็น `พร้อมทำ Scope` หรือเตือนว่า Brief ยังข้อมูลไม่พอ
- ถ้า Brief ยังอ่อน CTA ควรพาเปิด Brief เพื่อเติมข้อมูล ไม่ควรข้ามไป quote

### 4. สร้าง Scope จาก Brief
- กด `สร้าง Scope จาก Brief`
- ถ้ามี Scope เดิม ต้องเปิด Friendly Conflict UI
- ถ้ายังไม่มี Scope ต้องสร้างและเปิด Scope ทันที
- Scope ควรมี deliverables และ acceptance criteria ก่อนบอกว่าพร้อมเสนอราคา

### 5. ตรวจ Brief/Scope Quality
- ดู Brief / Scope Quality Panel
- ควรเห็น:
  - `ข้อมูลที่ยังต้องถามลูกค้า`
  - `จุดที่อาจทำให้งานบาน`
  - `สิ่งที่ควรเขียนให้ชัดก่อนเสนอราคา`
- ถ้า Scope ยังไม่มี deliverables/acceptance criteria ไม่ควรบอกว่าพร้อมเสนอราคา

### 6. สร้าง Follow-up จากคำถาม
- กด `สร้าง Follow-up จากคำถามนี้`
- ควรสร้างเอกสาร Follow-up จริง
- Follow-up ต้องมี:
  - คำถามที่เลือก
  - ที่มา: Brief/Scope quality analyzer
  - reference กลับไปยัง Brief/Scope
  - วิธีนำคำตอบกลับมาใช้
- หลังสร้างต้องเปิดเอกสารทันที

### 7. วางคำตอบลูกค้า
- กลับ Project Overview
- วางคำตอบใน `ข้อมูลที่ลูกค้าตอบกลับ`
- ระบบควรบอกว่า `คำตอบนี้กระทบ Brief/Scope อย่างไร`
- Action ที่ควรเกิด:
  - ข้อมูล deadline/budget/owner → update Brief
  - ข้อมูล deliverable/scope เพิ่ม → update Scope
  - scope change หลังอนุมัติ → สร้าง Change Request แทนการแก้ Scope เดิม
  - ข้อมูลยังไม่ชัด → สร้าง Follow-up เพื่อถามต่อ
  - ไม่มีผลกับงาน → ยังไม่ต้องทำอะไร

### 8. อัปเดต Brief/Scope แบบปลอดภัย
- ถ้าอัปเดต Brief/Scope ที่มีอยู่ ต้องเข้า Friendly Conflict UI
- ถ้า Scope approved/locked ต้องไม่เขียนทับเดิมเงียบ ๆ
- ต้องเลือก `สร้างเวอร์ชันใหม่` หรือสร้าง Change Request
- AI merge ถ้าใช้ไม่ได้ ต้อง fallback เป็นการรวมข้อมูลอย่างปลอดภัย

### 9. สร้าง Quote
- Project Readiness Gate ต้องบอก `พร้อมเสนอราคา` เฉพาะเมื่อ:
  - Brief มีข้อมูลพอ
  - Scope มี deliverables ชัด
  - Scope มี acceptance criteria ชัด
  - ไม่มี Follow-up/CR ที่ค้างและกระทบ Scope/Quote
- CTA ควรเป็น `สร้างใบเสนอราคา`

### 10. ตรวจ Readiness Gate หลัง Quote
- ถ้ามี Quote แต่ยังไม่มี approval/customer confirmation/evidence
  - Gate ควรอยู่ที่ `พร้อมขออนุมัติ` / รออนุมัติใบเสนอราคา
  - ห้ามถือว่า approved จาก status หรือ locked อย่างเดียว
- ถ้ามีหลักฐานอนุมัติ quote แล้ว
  - Gate ควรไป `พร้อมส่งมอบ` / `เตรียมตรวจรับ/ส่งมอบ`

### 11. เตรียม Acceptance
- กด `เตรียมตรวจรับ/ส่งมอบ`
- ต้องสร้าง Acceptance checklist
- ถ้ายังมี open Follow-up หรือ open CR/DCR ต้องไม่บอกว่าพร้อมส่งมอบ

## UX/Logic จุดเสี่ยงที่รอบนี้ harden แล้ว

- Readiness Gate ไม่ให้ `พร้อมเสนอราคา` ถ้า Brief ยังอ่อน แม้ Scope จะดูครบ
- Readiness Gate ไม่ให้ `พร้อมเสนอราคา` ถ้า Scope ไม่มี deliverables หรือ acceptance criteria
- Readiness Gate ไม่ถือว่า Quote approved จาก status/locked อย่างเดียว ต้องมี approval/customer confirmation/evidence
- Follow-up answer decision แยก update Brief / update Scope / create CR / ask more / no action
- Conflict-safe update ต้อง preserve approval/evidence และไม่ทำให้ approved scope ถูกเขียนทับเงียบ ๆ
- i18n keys สำคัญใน flow หลักถูก pin ด้วย regression test

## TODO / Next Wave เท่านั้น ไม่ใช่ scope รอบนี้

- เพิ่ม Playwright/E2E จริงเมื่อ app มี test harness สำหรับ Tauri/Web shell พร้อม fixture workspace
- เพิ่ม UI badge แสดงว่า Follow-up ใดตอบแล้ว/ยังไม่ตอบแบบคลิกย้อนกลับได้
- เพิ่ม workflow สำหรับบันทึก approval evidence จาก Line/email/file แนบโดยตรง
- เพิ่ม telemetry/debug panel เฉพาะ dev เพื่อดูว่า Gate ตัดสินจาก blocker อะไรบ้าง
