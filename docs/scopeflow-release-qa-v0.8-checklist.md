# ScopeFlow Release QA V0.8 Checklist

ใช้ checklist นี้เพื่อยืนยันว่า guided-readiness baseline พร้อมใช้งานจริงแบบ local desktop

## 1. Fresh Checkout Flow

ทดสอบในโฟลเดอร์ใหม่ที่ไม่พึ่ง local state เดิม

```bash
git clone <repo-url> ScopeFlow-release-qa-v0.8
cd ScopeFlow-release-qa-v0.8
npm install
npm run test
npm run build
npm run tauri dev
```

Expected:

- install สำเร็จโดยไม่ต้อง copy config จากเครื่องเดิม
- test ผ่าน
- build ผ่าน
- Tauri dev เปิด app ได้
- ไม่มี error ที่เกิดจาก path/config/cache เฉพาะเครื่องเดิม

## 2. Local Workspace Flow

สร้าง workspace ใหม่ แล้วไล่ flow:

1. สร้าง client/project ใหม่
2. กด `เริ่มจากคำขอลูกค้า`
3. วางคำขอลูกค้าแบบคลุมเครือ
4. สร้าง Brief
5. สร้าง Scope จาก Brief
6. ตรวจ Brief/Scope Quality
7. กด `สร้าง Follow-up จากคำถามนี้`
8. ตรวจว่า Follow-up ที่สร้างมี:
   - คำถามที่เลือก
   - ที่มา: Brief/Scope quality analyzer
   - reference กลับไปยัง Brief/Scope
9. วางคำตอบลูกค้าใน `ข้อมูลที่ลูกค้าตอบกลับ`
10. ตรวจว่า decision ถูกต้อง:
    - deadline/budget/owner → update Brief
    - deliverable/scope detail → update Scope
    - scope change หลังอนุมัติ → Change Request
    - ยังไม่ชัด → Follow-up ต่อ
    - ไม่เกี่ยว → no action
11. สร้างใบเสนอราคา
12. ตรวจ Readiness Gate
13. เตรียม Acceptance

## 3. UX Language QA

Flow หลักต้องไม่โชว์คำ technical โดยไม่จำเป็น

ผ่านเมื่อ:

- ปุ่มหลักใช้ภาษาไทยเชิงงานจริง
- error/notice อ่านเข้าใจง่าย
- `path`, `slug`, `markdown` อยู่เฉพาะ Advanced/manual หรือเอกสาร developer/release docs
- คำว่า provider/fallback/deterministic ไม่โผล่เป็น primary UX copy

## 4. Data Safety QA

ผ่านเมื่อ:

- ถ้ามีเอกสารเดิม ระบบไม่ overwrite เงียบ ๆ
- Friendly Conflict UI มี action ครบ:
  - เปิดเอกสารเดิม
  - รวมข้อมูลอย่างปลอดภัย
  - อัปเดตเอกสารเดิม
  - สร้างเวอร์ชันใหม่
  - แทนที่หลังยืนยัน
- approved/locked Scope ไม่ถูกเขียนทับเงียบ ๆ
- scope change หลัง approval ไปทาง Change Request หรือ version ใหม่
- Readiness Gate ไม่ผ่าน quote/delivery ถ้าไม่มี evidence/approval/customer confirmation

## 5. Release Notes / Known Limitations QA

ผ่านเมื่อ:

- README สื่อสารว่า V0.8 คือ local-first guided scope flow baseline
- `docs/RELEASE_NOTES_V0.8.md` มี Known Limitations
- ระบุชัดว่ายังไม่ใช่ production cloud/deploy
- ระบุ next wave:
  - Approval Evidence Capture UX
  - E2E Tauri Harness
  - Export / Package polish

## 6. Stop Conditions

ถ้าเจอสิ่งต่อไปนี้ ห้าม release โดยยังไม่แก้:

- `npm run test` fail
- `npm run build` fail
- Tauri dev เปิดไม่ได้จาก fresh checkout
- Readiness Gate บอกพร้อมเสนอราคาทั้งที่ Scope ไม่มี deliverables/acceptance criteria
- Readiness Gate บอกพร้อมส่งมอบทั้งที่ยังมี Follow-up/CR ค้าง
- approved/locked Scope ถูก overwrite เงียบ ๆ
- copy flow หลักยังเต็มไปด้วย technical terms
