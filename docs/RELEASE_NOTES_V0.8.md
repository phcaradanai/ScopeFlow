# ScopeFlow V0.8 — Guided Readiness Baseline

## Release Goal

V0.8 คือ baseline สำหรับใช้งาน ScopeFlow แบบ local desktop โดยเน้น guided scope-control flow ตั้งแต่คำขอลูกค้าจนถึง readiness ก่อนเสนอราคาและส่งมอบ

รอบนี้ไม่ได้เพิ่ม feature ใหญ่ แต่ใช้เพื่อยืนยันว่า flow หลัง Guided Operating Mode V1–V1.7 พร้อมใช้งานจริงในเครื่องผู้ใช้ ไม่ใช่แค่ test ผ่านใน dev flow

## What This Baseline Supports

- สร้าง workspace แบบ local-first
- สร้าง client/project ใหม่
- เริ่มจากคำขอลูกค้า
- สร้าง Brief
- สร้าง Scope จาก Brief
- ตรวจ Brief/Scope Quality
- สร้าง Follow-up จากคำถามที่ระบบแนะนำ
- วางคำตอบลูกค้ากลับเข้าระบบ
- ให้ระบบช่วยตัดสินว่า response ควร:
  - update Brief
  - update Scope
  - create Change Request
  - ask more questions
  - no action
- สร้างใบเสนอราคา
- ตรวจ Project Readiness Gate
- เตรียม Acceptance Checklist

## Release Confidence Checks

ก่อนถือว่า V0.8 พร้อมใช้งาน local desktop ต้องผ่าน:

```bash
npm install
npm run test
npm run build
npm run tauri dev
```

หรือใช้:

```bash
npm run tauri:dev
npm run release:check
```

หมายเหตุ: `npm run tauri dev` จะส่ง `dev` เป็น argument ให้ script `tauri` ซึ่งเรียก Tauri CLI

## Data Safety Guarantees Checked in This Baseline

- การ update เอกสารเดิมต้องไม่ทำข้อมูลหายเงียบ ๆ
- ถ้ามีเอกสารเดิม ต้องเข้า Friendly Conflict UI หรือ safe-update path
- approved/locked Scope ต้องไม่ถูก overwrite เงียบ ๆ
- AI ห้ามสร้าง approval/evidence/customer confirmation เอง
- ถ้า AI ใช้ไม่ได้ ต้อง fallback เป็น logic พื้นฐานและไม่ block flow หลัก
- Readiness Gate ต้องไม่ผ่าน quote/delivery ถ้าไม่มีข้อมูลหรือหลักฐานที่จำเป็น

## Readiness Gate Guard Rails

Gate ต้องไม่บอกว่า `พร้อมเสนอราคา` ถ้า:

- ไม่มี Brief
- Brief ยังข้อมูลไม่พอ
- ไม่มี Scope
- Scope ไม่มี deliverables ชัดเจน
- Scope ไม่มี acceptance criteria ชัดเจน
- มี Follow-up ที่ยังไม่ปิดและอาจกระทบ Scope
- มี CR/DCR ที่ยังไม่ปิดและอาจกระทบ Quote

Gate ต้องไม่บอกว่า `พร้อมส่งมอบ` ถ้า:

- ใบเสนอราคายังไม่มี approval/customer confirmation/evidence
- ยังไม่มี Acceptance Checklist
- ยังไม่มี evidence/customer confirmation สำหรับการตรวจรับ
- ยังมี open Follow-up หรือ open CR/DCR

## UX Language Rules

- Flow หลักต้องใช้ Thai-first copy
- ใช้คำเชิงงานจริง เช่น:
  - คำขอลูกค้า
  - Brief
  - Scope
  - ใบเสนอราคา
  - อนุมัติ
  - เปลี่ยนงาน
  - ส่งมอบ/ตรวจรับ
  - รวมข้อมูลอย่างปลอดภัย
  - สร้างเวอร์ชันใหม่
- คำ technical เช่น path, slug, markdown ใช้ได้เฉพาะ Advanced/manual พร้อมคำอธิบายไทย
- error/notice ใน flow หลักต้องเป็นภาษาไทยอ่านรู้เรื่อง

## Known Limitations

V0.8 ยังไม่ใช่ production cloud/deploy product

ยังไม่รองรับเต็มรูปแบบ:

- Cloud sync
- Multi-user collaboration
- Client portal
- Production backend/cloud deployment
- Legal-grade e-signature
- Direct PDF generation engine
- Full accounting/tax invoice/payment workflow
- Fully automated Tauri E2E harness
- Polished export/package flow สำหรับส่งชุดเอกสารให้ลูกค้าแบบ production-ready

## Next Wave

1. Approval Evidence Capture UX
   - ทำ flow บันทึกหลักฐาน approval/customer confirmation ให้ชัดกว่าเดิม
   - แนบ evidence จากไฟล์/ข้อความ/อีเมล/รูปภาพได้ง่ายขึ้น

2. E2E Tauri Harness
   - สร้าง fixture workspace
   - รัน flow ผ่าน desktop shell จริง
   - เก็บ acceptance evidence ของ UI state

3. Export / Package Polish
   - ทำชุดส่งลูกค้าแบบ package-ready
   - Polish HTML/print/export flow
   - เชื่อมกับ readiness gate ว่า package พร้อมส่งหรือยัง

## Release Decision

V0.8 ควรถูกมองเป็น `local-first guided scope flow baseline`

ผ่านได้เมื่อ:

- fresh checkout commands ผ่าน
- local desktop app เปิดได้ด้วย Tauri
- manual workspace flow ผ่านตั้งแต่คำขอลูกค้าถึง Acceptance
- readiness gate ไม่ให้ผ่านผิด
- conflict modal / safe update flow ไม่ทำข้อมูลหาย
- known limitations ถูกสื่อสารชัดเจน
