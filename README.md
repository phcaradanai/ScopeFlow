# ScopeFlow Thai

ScopeFlow Thai คือ local-first desktop app สำหรับช่วยฟรีแลนซ์และทีมพัฒนาซอฟต์แวร์ไทยเปลี่ยนคำขอลูกค้าที่คลุมเครือให้เป็น Brief, Scope, ใบเสนอราคา, Change Request, Follow-up และเอกสารส่งมอบ/ตรวจรับที่ควบคุมขอบเขตงานได้จริง

เป้าหมายหลักไม่ใช่การเป็น note app แต่คือการช่วยตอบคำถามว่า:

- ตอนนี้โครงการพร้อมไปต่อหรือยัง
- ยังติดคำตอบลูกค้าหรือหลักฐานอะไร
- ควรสร้าง Brief, Scope, ใบเสนอราคา, Change Request หรือ Acceptance ต่อ
- Scope ที่อนุมัติแล้วปลอดภัยจากการถูกแก้ทับเงียบ ๆ หรือไม่

## สถานะ V0.8 Guided Readiness Baseline

V0.8 เป็น baseline สำหรับการใช้งานแบบ local desktop โดยเน้น guided scope-control flow:

- เริ่มจากคำขอลูกค้า แล้วเดินต่อเป็น Brief / Scope
- ตรวจคุณภาพ Brief/Scope ก่อนเสนอราคา
- สร้าง Follow-up จากคำถามที่ยังขาด
- วางคำตอบลูกค้ากลับเข้าระบบ แล้วให้ระบบช่วยตัดสินว่าควร update Brief, update Scope, สร้าง Change Request, ถามต่อ หรือไม่ต้องทำอะไร
- ตรวจ Project Readiness Gate เพื่อบอกว่า `พร้อมเสนอราคา`, `ยังไม่ควรเสนอราคา`, `พร้อมส่งมอบ`, หรือ `ยังติดอะไร`
- ใช้ conflict/update flow เพื่อไม่ให้ข้อมูลสำคัญหรือ approval หายเงียบ ๆ

## ฟีเจอร์หลัก

- **Local-first workspace**: ข้อมูลอยู่ในโฟลเดอร์บนเครื่องผู้ใช้ เหมาะกับการทำงาน desktop/local ก่อน
- **Guided Operating Mode**: หน้าโครงการบอก action ถัดไปจากสถานะจริงของเอกสาร ไม่ต้องจำ flow เอง
- **Brief/Scope Quality**: ตรวจข้อมูลที่ยังต้องถามลูกค้า จุดเสี่ยงงานบาน และสิ่งที่ควรเขียนให้ชัดก่อนเสนอราคา
- **Follow-up Loop**: สร้าง Follow-up จากคำถาม และนำคำตอบลูกค้ากลับมาวิเคราะห์ผลกระทบต่อ Brief/Scope/CR
- **Project Readiness Gate**: ตรวจ readiness ตั้งแต่คำขอลูกค้าถึงส่งมอบ พร้อม guard rails เรื่อง quote/approval/acceptance
- **Friendly Conflict UI**: เมื่อเอกสารเดิมมีอยู่แล้ว ผู้ใช้เลือกเปิดเดิม, รวมข้อมูลอย่างปลอดภัย, อัปเดต, สร้างเวอร์ชันใหม่ หรือแทนที่หลังยืนยันได้
- **Approval / Evidence Guard Rails**: ไม่ถือว่าอนุมัติแล้วถ้าไม่มีหลักฐาน approval/customer confirmation และไม่เขียนทับ Scope ที่ approved/locked แบบเงียบ ๆ
- **Thai-first copy + lightweight i18n foundation**: flow หลักใช้ภาษาไทยเชิงงานจริง โดยเก็บคำ technical ไว้ใน Advanced/manual เท่านั้น

## AI Assistance

ScopeFlow V0.8 รองรับ AI-assisted flow แบบ optional ผ่าน provider ที่ผู้ใช้ตั้งค่าเอง ถ้า AI ใช้ไม่ได้ ระบบต้อง fallback เป็น deterministic/basic logic และไม่ block flow หลัก

AI ในรอบนี้ใช้เพื่อช่วย:

- วิเคราะห์คุณภาพ Brief/Scope
- วิเคราะห์คำตอบลูกค้าใน Follow-up loop
- เสนอการรวมข้อมูลอย่างปลอดภัย

Guard rails สำคัญ:

- AI ห้ามสร้าง approval, evidence หรือ customer confirmation เอง
- Scope ที่ approved/locked ต้องเสนอเป็น version ใหม่หรือ Change Request แทนการเขียนทับเงียบ ๆ
- Readiness Gate ต้องไม่ผ่านถ้าไม่มีหลักฐาน approval/evidence จริง

## ข้อจำกัดที่ตั้งใจไว้ใน V0.8

V0.8 ยังไม่ใช่ production cloud/deploy product และยังไม่ใช่ระบบ portal สำหรับลูกค้าโดยตรง

ยังไม่ครอบคลุม:

- Cloud sync / multi-user collaboration / client portal
- Production deployment หรือ backend cloud service
- E-signature ที่มีผลทางกฎหมายแบบเต็มรูปแบบ
- Direct PDF engine ในแอป
- ระบบบัญชี/ภาษี/รับชำระเงินเต็มรูปแบบ
- E2E Tauri harness แบบอัตโนมัติครบ flow

Next wave ที่ควรทำต่อ:

- Approval Evidence Capture UX
- E2E Tauri Harness
- Export / Package polish

## การติดตั้งและรันทดสอบจาก fresh checkout

### ข้อกำหนดเบื้องต้น

- Node.js 18+
- Rust stable toolchain
- Tauri prerequisites ตาม OS
  - Windows: WebView2
  - macOS: Xcode Command Line Tools
  - Linux: WebKit2GTK และ dependency ของ Tauri

### คำสั่งหลัก

```bash
npm install
npm run test
npm run build
npm run tauri dev
```

หรือใช้ script ที่เตรียมไว้:

```bash
npm run tauri:dev
npm run release:check
```

หมายเหตุ:

- `npm run tauri dev` ใช้ script `tauri` แล้วส่ง argument `dev` ต่อให้ Tauri CLI
- `npm run tauri:dev` เป็น shortcut ที่ชัดกว่า
- `npm run release:check` รัน frontend test/build และ Rust test ฝั่ง `src-tauri`

## Release QA Checklist แบบย่อ

ก่อนถือว่า V0.8 พร้อมใช้งาน local desktop:

1. fresh clone repo ใหม่
2. `npm install`
3. `npm run test`
4. `npm run build`
5. `npm run tauri dev` หรือ `npm run tauri:dev`
6. สร้าง workspace ใหม่
7. สร้าง client/project ใหม่
8. เริ่มจากคำขอลูกค้า
9. สร้าง Brief
10. สร้าง Scope จาก Brief
11. ตรวจ Brief/Scope Quality
12. สร้าง Follow-up จากคำถาม
13. วางคำตอบลูกค้ากลับเข้าระบบ
14. ตรวจว่าระบบ route ไป update Brief / Scope / CR / ถามต่อ / no action ถูกต้อง
15. สร้างใบเสนอราคา
16. ตรวจ Readiness Gate
17. เตรียม Acceptance
18. ตรวจว่า approved/locked Scope ไม่ถูกเขียนทับเงียบ ๆ

ดูรายละเอียดเต็มได้ใน `docs/RELEASE_NOTES_V0.8.md` และ `docs/scopeflow-release-qa-v0.8-checklist.md`
