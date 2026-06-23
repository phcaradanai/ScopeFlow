# ScopeFlow Thai
ระบบจัดการเอกสารขอบเขตงาน (Scope) สำหรับฟรีแลนซ์และทีมพัฒนาซอฟต์แวร์ไทย ออกแบบมาเพื่อลดปัญหาบานปลาย (Scope Creep) และทำงานแบบ Offline-First อย่างแท้จริง

## ฟีเจอร์หลัก (MVP Release)
- **Local-First & Offline-First**: ทุกอย่างทำงานในเครื่องของคุณ ข้อมูลถูกเก็บเป็นไฟล์ Markdown (.md) และ YAML (.yaml) ไม่มีการอัปโหลดขึ้นเซิร์ฟเวอร์ภายนอก (100% Privacy)
- **File-First Architecture**: เปิดโฟลเดอร์ใดก็ได้เป็น Workspace แฟ้มโปรเจ็กต์จะถูกจัดระเบียบให้อัตโนมัติและสามารถแก้ไขผ่านโปรแกรมอื่นๆ ได้
- **เอกสารครบวงจร**: จัดการ Scope, Quotation (ใบเสนอราคา), Change Requests (CR), Defect Change Requests (DCR), Support Requests (SUP), Maintenance (MA), และ Acceptance Checklist
- **ระบบแบบฟอร์ม & คำนวณอัตโนมัติ**: มีฟอร์มกรอกง่ายๆ พร้อมคำนวณ VAT, ส่วนลด, และราคาสุทธิให้อัตโนมัติ
- **ระบบพิจารณาและบันทึกการอนุมัติ**: รองรับการแนบไฟล์หลักฐาน (.txt, .eml, .png ฯลฯ) ควบคู่กับบันทึกการอนุมัติ (Approval Record)
- **ล็อกเอกสาร (Document Locking)**: ป้องกันการแก้ไขเอกสารที่ได้รับการอนุมัติแล้ว และรองรับการทำ Revision ใหม่เมื่อมีการเปลี่ยนแปลง
- **ส่งออกออฟไลน์ (Printable HTML Export)**: สร้างชุดเอกสาร HTML พร้อมพิมพ์ (Print to PDF) ได้ทันที โดยไม่มีการเรียก External Libraries
- **Health Check & Backup**: ตรวจสอบความสมบูรณ์ของไฟล์และโครงสร้างโฟลเดอร์ พร้อมความสามารถในการแบ็คอัปเป็นไฟล์ ZIP แบบเบ็ดเสร็จ (การแบ็คอัปจะครอบคลุมไฟล์เอกสารและไฟล์การตั้งค่าของผู้ใช้ เช่น .scopeflow/company-profile.yaml แต่จะไม่รวมไฟล์แคชหรือไฟล์ที่ระบบสร้างขึ้นใหม่ได้เพื่อประหยัดพื้นที่)

## ข้อจำกัดที่ตั้งใจไว้ (Non-Goals)
เพื่อรักษาความเรียบง่าย โปรแกรม **จะไม่มี** ระบบต่อไปนี้:
- Cloud Sync, ระบบล็อกอิน (Login) และ Client Portal
- ฐานข้อมูล (Database) อย่าง SQLite หรือ MySQL (ใช้ Filesystem ล้วนๆ)
- ระบบออกเอกสารใบกำกับภาษีเต็มรูปแบบ (Billing) หรือระบบ CRM ขั้นสูง
- ปัญญาประดิษฐ์ (AI)
- ระบบ e-Signature (ใช้การบันทึกหลักฐานแทน)
- ระบบแปลง PDF โดยตรง (ใช้ความสามารถ Print ของระบบปฏิบัติการแทน)

## ความปลอดภัย (Security Notes)
- การประมวลผลทั้งหมดทำงานฝั่ง Client 
- ไฟล์ข้อมูลของคุณทั้งหมดจะอยู่บนโฟลเดอร์ในเครื่องของคุณเอง 
- โปรแกรมมีการจำกัดการประมวลผล HTML ที่จะถูกสร้างเป็นไฟล์ Export เพื่อป้องกัน XSS

## การติดตั้งและการใช้งาน (สำหรับนักพัฒนา)

### ข้อกำหนดเบื้องต้น
- Node.js (v18+)
- Rust (v1.70+)
- Tauri CLI

### คำสั่งใช้งาน

1. ติดตั้งไลบรารี
```bash
npm install
```

2. รันโหมดนักพัฒนา
```bash
npm run tauri:dev
```

3. สร้างไฟล์ติดตั้ง (Build)
```bash
npm run tauri:build
```

4. ทดสอบ (Tests)
```bash
# ทดสอบ Frontend
npm run test

# ทดสอบ Backend
cd src-tauri && cargo test
```

## Release Candidate Test Checklist

ก่อนการทำ Release โปรดทดสอบตามขั้นตอนต่อไปนี้ (Smoke Test):

1. สร้าง Demo Workspace
2. รัน Health Check
3. สร้างใบเสนอราคา (Quotation)
4. บันทึกการอนุมัติ (Approval Record)
5. ล็อกเอกสาร (Lock Document)
6. สร้างการแก้ไข (Revision)
7. ส่งออกชุดเอกสาร (Export Approval Pack)
8. สำรองข้อมูล Workspace (Backup)
9. เปิดจากแบ็คอัป (Restore) โดยเลือกโฟลเดอร์ปลายทาง
10. เปิด Workspace ที่กู้คืนมา
11. รัน Health Check อีกครั้ง

หมายเหตุการ Build บนแพลตฟอร์มต่างๆ:
- Windows: ต้องติดตั้ง WebView2
- macOS: ต้องมี Xcode Command Line Tools
- Linux: ต้องมีไลบรารี WebKit2GTK
