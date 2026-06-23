# ScopeFlow Thai - Build Instructions

ไฟล์นี้อธิบายวิธีการคอมไพล์ รัน และทดสอบ ScopeFlow Thai สำหรับนักพัฒนา

## คำสั่งสำหรับนักพัฒนา (Development Commands)

เริ่มต้นการรันแอปในโหมดนักพัฒนา:
```bash
npm run tauri:dev
```

## คำสั่งทดสอบ (Testing)

ทดสอบระบบให้แน่ใจว่าไม่มีส่วนใดเสียหายก่อนทำการส่งมอบ:

**ทดสอบฝั่ง Frontend (Vitest):**
```bash
npm run test
```

**ทดสอบฝั่ง Backend (Cargo Test):**
```bash
cd src-tauri && cargo test
```

**ทดสอบทั้งระบบรวดเดียว (Smoke Test):**
```bash
npm run smoke-test
```
*(คำสั่งนี้จะรันทั้ง Frontend Tests, Backend Tests และ Build Frontend แบบทดสอบ)*

**ตรวจเช็คก่อนการ Release:**
```bash
npm run release:check
```

## คำสั่งสำหรับการสร้างแอป (Production Build)

เพื่อคอมไพล์แอปเป็นไฟล์สำหรับติดตั้งให้ผู้ใช้งาน (Executable/Installer):
```bash
npm run build
npm run tauri:build
```

**หมายเหตุเกี่ยวกับ Build Artifacts:**
- เมื่อ `tauri:build` ทำงานเสร็จ ไฟล์ผลลัพธ์ (Artifacts) จะอยู่ใน: `src-tauri/target/release/bundle/`
- **macOS**: จะได้ไฟล์ `.app` และไฟล์ `.dmg`
- **Windows**: จะได้ไฟล์ `.exe` และ/หรือ `.msi`
- **Linux**: จะได้ไฟล์ `.AppImage`, `.deb`, หรือไฟล์ที่เกี่ยวข้องตามแพลตฟอร์ม

## หมายเหตุสำคัญเพิ่มเติม

- **Unsigned App Warning**: เนื่องจากแอปนี้สร้างขึ้นสำหรับการทดสอบแบบ Beta ไฟล์ Build ทั่วไปในขั้นตอนนี้อาจจะยังไม่ได้ผ่านกระบวนการเซ็นใบรับรองของนักพัฒนา (Code Signing/Notarization)
  - บน **macOS**: ผู้ใช้งานอาจเห็นคำเตือน "App is damaged" หรือ "Unverified Developer" ให้อธิบายวิธีการหลีกเลี่ยง เช่น ใช้คำสั่ง `xattr -cr /path/to/ScopeFlowThai.app` หรือตั้งค่า Security
  - บน **Windows**: ผู้ใช้ระบบอาจจะเห็นหน้าจอ SmartScreen ขึ้นเตือน 
- **Backup & Restore Safety Note**: การแบ็คอัปและกู้คืนถูกสร้างมาให้ปลอดภัยด้วยการแยกไฟล์ `.scopeflow` ออกจากแคชอย่างระมัดระวัง ไฟล์แบ็คอัปจะเป็น ZIP แบบมาตรฐาน หากต้องทำการดีบักสามารถเปิดไฟล์ ZIP ตรวจสอบด้วยตัวเองได้
