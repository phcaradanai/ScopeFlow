import YAML from 'yaml';
import { readFileContent, writeFileContent, pathExists } from './tauri-commands';

export interface CompanyProfile {
  provider_name: string;
  provider_type?: 'freelancer' | 'company' | 'agency';
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  website?: string;
  line_id?: string;
  default_currency?: string;
  default_vat_percent?: number;
  default_payment_terms?: string;
  default_warranty_terms?: string;
  default_support_terms?: string;
}

export interface Presets {
  payment_terms: string[];
  out_of_scope: string[];
  warranty_terms: string[];
  support_terms: string[];
  revision_terms: string[];
}

const defaultPresets: Presets = {
  payment_terms: [
    "แบ่งชำระ 50% ก่อนเริ่มงาน และ 50% เมื่อส่งมอบงานเสร็จสมบูรณ์",
    "แบ่งชำระ 30% ก่อนเริ่มงาน, 40% หลังส่งมอบงานระยะที่ 1, และ 30% เมื่อส่งมอบงานเสร็จสมบูรณ์",
    "ชำระเต็มจำนวน 100% ก่อนเริ่มงาน",
  ],
  out_of_scope: [
    "การจัดทำเนื้อหา (Content / Copywriting)",
    "การออกแบบโลโก้ หรือ CI (Corporate Identity) ของแบรนด์",
    "ค่าบริการเซิร์ฟเวอร์ (Hosting) และโดเมนเนม (Domain Name)",
  ],
  warranty_terms: [
    "รับประกันผลงานเป็นระยะเวลา 30 วัน นับจากวันส่งมอบงาน",
    "รับประกันแก้ไขข้อผิดพลาด (Bugs) เป็นเวลา 90 วัน",
  ],
  support_terms: [
    "ให้คำปรึกษาผ่านช่องทางออนไลน์ (Line/Email) ในเวลาทำการ จันทร์-ศุกร์ 09:00 - 18:00 น.",
    "บริการแก้ไขปัญหาฉุกเฉิน (Critical Issues) ตลอด 24 ชั่วโมง",
  ],
  revision_terms: [
    "อนุญาตให้ปรับแก้ไขงานได้ไม่เกิน 3 ครั้ง โดยต้องไม่กระทบกับโครงสร้างหลักที่ได้ตกลงกันไว้",
    "หากแก้ไขเกินจำนวนครั้งที่กำหนด จะมีการคิดค่าใช้จ่ายเพิ่มเติม",
  ]
};

export async function getCompanyProfile(workspacePath: string): Promise<CompanyProfile | null> {
  const profilePath = `${workspacePath}/.scopeflow/company-profile.yaml`;
  const exists = await pathExists(profilePath);
  if (!exists) {
    return null;
  }
  
  try {
    const content = await readFileContent(profilePath);
    const parsed = YAML.parse(content) as CompanyProfile;
    return parsed;
  } catch (err) {
    console.error("Failed to parse company profile:", err);
    throw new Error('MALFORMED_YAML', { cause: err });
  }
}

export async function saveCompanyProfile(workspacePath: string, profile: CompanyProfile): Promise<void> {
  const profilePath = `${workspacePath}/.scopeflow/company-profile.yaml`;
  const yamlContent = YAML.stringify(profile);
  await writeFileContent(profilePath, yamlContent);
}

export async function getPresets(workspacePath: string): Promise<Presets> {
  const presetsPath = `${workspacePath}/.scopeflow/presets.yaml`;
  const exists = await pathExists(presetsPath);
  
  if (!exists) {
    // Generate default presets file
    await savePresets(workspacePath, defaultPresets);
    return defaultPresets;
  }
  
  try {
    const content = await readFileContent(presetsPath);
    const parsed = YAML.parse(content) as Presets;
    return { ...defaultPresets, ...parsed }; // Merge with defaults just in case fields are missing
  } catch (err) {
    console.error("Failed to parse presets:", err);
    return defaultPresets;
  }
}

export async function savePresets(workspacePath: string, presets: Presets): Promise<void> {
  const presetsPath = `${workspacePath}/.scopeflow/presets.yaml`;
  const yamlContent = YAML.stringify(presets);
  await writeFileContent(presetsPath, yamlContent);
}
