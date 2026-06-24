import YAML from 'yaml';
import { todayISO } from './validation';

export interface BriefFormData {
  raw_request: string;
  project_type: string;
}

export interface PresetData {
  understanding?: string[];
  assumptions?: string[];
  unclear?: string[];
  questions: string[];
  inScope: string[];
  outOfScope: string[];
  deliverables: string[];
  acceptance: string[];
  risks: string[];
}

export const projectPresets: Record<string, PresetData> = {
  'เว็บไซต์บริษัท': {
    questions: [
      'ควรยืนยันเรื่องโดเมนและโฮสติ้ง (ใครเป็นผู้รับผิดชอบ, มีอยู่แล้วหรือไม่)',
      'ควรยืนยันเรื่องเนื้อหา (รูปภาพ, ข้อความ, โลโก้) ว่าลูกค้าเตรียมให้ หรือเราต้องหาให้',
      'อาจต้องถามเรื่องภาษาของเว็บไซต์ (ไทยอย่างเดียว หรือสองภาษา)'
    ],
    inScope: [
      'อาจต้องรวมหน้าแรก (Home), เกี่ยวกับเรา (About Us), บริการ (Services), ติดต่อเรา (Contact)',
      'อาจต้องรวมระบบจัดการเนื้อหา (CMS) ให้ลูกค้าแก้ข้อมูลเองได้',
      'อาจต้องรวมการออกแบบให้รองรับมือถือ (Responsive Design)'
    ],
    outOfScope: [
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมการถ่ายภาพสินค้าหรือถ่ายทำวีดีโอใหม่',
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมการเขียนบทความ (Copywriting)',
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมค่าซื้อโดเมนและโฮสติ้งรายปี'
    ],
    deliverables: [
      'Source Code ของเว็บไซต์',
      'คู่มือการใช้งานระบบจัดการเนื้อหา (CMS)',
      'สิทธิ์การเข้าถึงระดับ Admin'
    ],
    acceptance: [
      'หน้าเว็บแสดงผลได้ถูกต้องบน Chrome, Safari ทั้งบน Desktop และ Mobile',
      'แบบฟอร์มติดต่อสามารถส่งอีเมลถึงผู้ดูแลระบบได้จริง'
    ],
    risks: [
      'ความเสี่ยงงานงอก: ลูกค้าส่งเนื้อหาช้า ทำให้โปรเจกต์ดีเลย์ ควรระบุเวลาส่งมอบเนื้อหาให้ชัดเจน',
      'ความเสี่ยงงานงอก: ขอแก้ดีไซน์ไม่รู้จบ ควรจำกัดรอบการแก้ไข (เช่น แก้ดีไซน์หลักได้ 2 ครั้ง)'
    ]
  },
  'เว็บขายของ': {
    understanding: [
      'ลูกค้าต้องการระบบหรือแอปสำหรับขายสินค้าออนไลน์',
      'งานอาจเกี่ยวข้องกับหน้ารายการสินค้า, รายละเอียดสินค้า, ตะกร้า, การสั่งซื้อ, และหลังบ้านจัดการสินค้า',
      'ยังไม่ชัดว่าเป็น Web App, Mobile App, หรือทั้งสองแบบ'
    ],
    assumptions: [
      'อาจต้องมีสินค้าและหมวดหมู่สินค้า',
      'อาจต้องมีระบบสั่งซื้อ',
      'อาจต้องมีหลังบ้านสำหรับจัดการสินค้าและออเดอร์'
    ],
    unclear: [
      'ต้องการ Web, Mobile App, หรือทั้งสองแบบ',
      'ต้องมีชำระเงินออนไลน์หรือไม่',
      'ต้องมีระบบจัดส่งหรือไม่',
      'ต้องมีสมาชิก/login หรือไม่',
      'ต้องมีสต็อกหรือไม่',
      'ต้องเชื่อมต่อระบบเดิมหรือไม่'
    ],
    questions: [
      'ลูกค้าขายสินค้ากี่ประเภท / กี่รายการโดยประมาณ',
      'ต้องมีตะกร้าสินค้าหรือแค่ส่งคำสั่งซื้อผ่าน LINE',
      'ต้องรับชำระเงินแบบใด',
      'ต้องคิดค่าส่งอย่างไร',
      'ใครเป็นคนเพิ่ม/แก้ไขสินค้า',
      'ต้องมีรายงานยอดขายหรือไม่'
    ],
    inScope: [
      'อาจต้องรวมระบบตะกร้าสินค้าและการสั่งซื้อ (Cart & Checkout)',
      'อาจต้องรวมระบบจัดการสินค้าและหมวดหมู่',
      'อาจต้องรวมระบบแจ้งเตือนคำสั่งซื้อผ่านอีเมลหรือ Line'
    ],
    outOfScope: [
      'payment gateway fee/setup',
      'shipping integration',
      'product data entry',
      'ERP/POS/accounting integration',
      'advanced promotion/coupon',
      'mobile app if not confirmed',
      'SEO/content writing'
    ],
    deliverables: [
      'Source Code ของระบบ',
      'คู่มือการใช้งานระบบจัดการสินค้าและคำสั่งซื้อ',
      'สิทธิ์การเข้าถึงระดับ Admin'
    ],
    acceptance: [
      'ลูกค้าสามารถกดสั่งซื้อและชำระเงินได้จริง',
      'ระบบตัดสต็อกถูกต้องเมื่อสั่งซื้อสำเร็จ'
    ],
    risks: [
      'payment/shipping requirements unclear',
      'product migration may be larger than expected',
      'platform unclear: web vs mobile',
      'customer may expect admin/report/member/promotion later'
    ]
  },
  'ระบบจองคิว': {
    questions: [
      'ควรยืนยันเรื่องตารางเวลา (มีกี่คิวต่อวัน, จองล่วงหน้าได้กี่วัน)',
      'ควรยืนยันเรื่องการยกเลิก/เลื่อนคิว (ให้ลูกค้าทำเองได้หรือไม่, คืนเงินหรือไม่)',
      'ควรยืนยันเรื่องช่องทางการแจ้งเตือน (SMS, อีเมล, Line OA)'
    ],
    inScope: [
      'อาจต้องรวมระบบปฏิทินให้ลูกค้าเลือกวันเวลาจอง',
      'อาจต้องรวมหน้า Dashboard สำหรับพนักงานดูคิวรายวัน',
      'อาจต้องรวมระบบแจ้งเตือนเมื่อจองสำเร็จ'
    ],
    outOfScope: [
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมค่าบริการส่ง SMS',
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมฮาร์ดแวร์สำหรับออกบัตรคิวหน้าร้าน'
    ],
    deliverables: [
      'Source Code ของระบบจองคิว',
      'คู่มือการใช้งานสำหรับแอดมินและพนักงาน'
    ],
    acceptance: [
      'ลูกค้าไม่สามารถจองคิวในเวลาที่เต็มแล้วได้',
      'ระบบส่งข้อความยืนยันไปยังลูกค้าได้สำเร็จ'
    ],
    risks: [
      'ความเสี่ยงงานงอก: ลูกค้าต้องการเงื่อนไขการจองที่ซับซ้อน (เช่น บริการ A ใช้เวลา 30 นาที, บริการ B ใช้เวลา 2 ชม.)'
    ]
  },
  'ระบบหลังบ้าน': {
    questions: [
      'ควรยืนยันเรื่องจำนวนผู้ใช้งานและสิทธิ์ (Roles & Permissions)',
      'ควรยืนยันเรื่องการรายงานผล (ต้องมี Report ออกมาเป็น Excel หรือ PDF หรือไม่)',
      'ควรยืนยันเรื่องข้อมูลเริ่มต้น (Data Migration) ว่าต้องย้ายข้อมูลจากระบบเก่ามาด้วยไหม'
    ],
    inScope: [
      'อาจต้องรวมระบบล็อกอินและจัดการสิทธิ์',
      'อาจต้องรวมระบบจัดการข้อมูล (CRUD) ตามที่ระบุ',
      'อาจต้องรวมตารางสรุปข้อมูลเบื้องต้น'
    ],
    outOfScope: [
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมการทำ App มือถือ (เป็น Web App เท่านั้น)',
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมการย้ายข้อมูลที่โครงสร้างแตกต่างกันมากโดยไม่ตกลงล่วงหน้า'
    ],
    deliverables: [
      'Source Code ของระบบ Web App',
      'Database Schema',
      'คู่มือการใช้งาน'
    ],
    acceptance: [
      'ผู้ใช้แต่ละระดับมองเห็นเมนูไม่เหมือนกันตามสิทธิ์ที่ตั้งไว้',
      'ระบบสามารถบันทึกและแก้ไขข้อมูลได้ถูกต้อง'
    ],
    risks: [
      'ความเสี่ยงงานงอก: การขอ Report ที่มีเงื่อนไขซับซ้อนเพิ่มเติมระหว่างการพัฒนา'
    ]
  },
  'Dashboard/Report': {
    questions: [
      'ควรยืนยันแหล่งข้อมูล (ข้อมูลมาจากไหน, Excel, Database, API)',
      'ควรยืนยันความถี่ของการอัปเดตข้อมูล (Real-time, อัปเดตรายวัน)',
      'ควรยืนยันว่าใครเป็นคนดู (ภายในทีม, ผู้บริหาร, ลูกค้าทั่วไป)'
    ],
    inScope: [
      'อาจต้องรวมการสร้างกราฟแสดงผลตาม KPI',
      'อาจต้องรวมระบบกรองข้อมูล (Filter) ตามวันที่หรือหมวดหมู่',
      'อาจต้องรวมการ Export กราฟหรือข้อมูลออกเป็น PDF/Excel'
    ],
    outOfScope: [
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมการทำ Data Cleansing ข้อมูลที่สกปรกจากระบบเก่า',
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมค่า License ของเครื่องมือ (ถ้าใช้ PowerBI, Tableau)'
    ],
    deliverables: [
      'Dashboard ระบบ/ลิงก์ใช้งาน',
      'เอกสารอธิบายสูตรคำนวณของแต่ละกราฟ'
    ],
    acceptance: [
      'กราฟแสดงข้อมูลตรงกับฐานข้อมูลจริง',
      'ผู้ใช้สามารถกรองข้อมูลตามช่วงเวลาได้'
    ],
    risks: [
      'ความเสี่ยงงานงอก: ข้อมูลต้นทางมีการเปลี่ยนโครงสร้าง ทำให้เชื่อมต่อไม่ได้',
      'ความเสี่ยงงานงอก: ลูกค้าขอเพิ่มมุมมอง (Dimensions) ใหม่ๆ ไม่รู้จบ'
    ]
  },
  'แก้ระบบเดิม': {
    questions: [
      'ควรยืนยันว่ามี Source Code และสิทธิ์เข้าถึง Server ครบถ้วนหรือไม่',
      'ควรยืนยันว่าระบบเก่าพัฒนาด้วยเทคโนโลยีอะไร เวอร์ชันไหน',
      'ควรยืนยันเรื่องการทำ Backup ก่อนแก้'
    ],
    inScope: [
      'อาจต้องรวมการวิเคราะห์ Code เดิมเพื่อหาจุดแก้ (Code Review / Auditing)',
      'อาจต้องรวมการแก้บั๊กหรือปรับปรุงตามขอบเขตที่ระบุ',
      'อาจต้องรวมการ Deploy งานขึ้น Server เดิม'
    ],
    outOfScope: [
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รับประกันส่วนอื่นๆ ของระบบเก่าที่เราไม่ได้แก้ไข',
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมการอัปเกรดเวอร์ชัน (Major Upgrade) ของ Framework หากไม่จำเป็น'
    ],
    deliverables: [
      'Source Code เฉพาะส่วนที่แก้ไข (หรือ Patch)',
      'บันทึกการแก้ไข (Changelog)'
    ],
    acceptance: [
      'ปัญหาที่ระบุได้รับการแก้ไขตามที่ทดสอบบนสภาพแวดล้อมจำลอง',
      'ระบบส่วนอื่นไม่ได้รับผลกระทบ'
    ],
    risks: [
      'ความเสี่ยงงานงอก: เจอ Technical Debt ซ่อนอยู่ในระบบเก่า ทำให้ใช้เวลาแก้นานกว่าที่คาด',
      'ความเสี่ยงงานงอก: แก้อย่างหนึ่งไปกระทบอีกอย่างหนึ่ง (Regression)'
    ]
  },
  'เพิ่ม Feature': {
    questions: [
      'ควรยืนยันว่ามี Source Code และเอกสารของระบบปัจจุบันหรือไม่',
      'ควรยืนยันว่าฟีเจอร์ใหม่นี้กระทบกับข้อมูลเดิมอย่างไร',
      'ควรยืนยันว่าหน้าตา UI ของฟีเจอร์ใหม่ต้องล้อตามดีไซน์เดิมหรือทำใหม่'
    ],
    inScope: [
      'อาจต้องรวมการพัฒนาฟีเจอร์ใหม่และเชื่อมต่อกับระบบหลัก',
      'อาจต้องรวมการออกแบบ UI สำหรับฟีเจอร์นี้ให้เข้ากับระบบเดิม',
      'อาจต้องรวมการอัปเดต Database Schema'
    ],
    outOfScope: [
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมการแก้ไขฟีเจอร์เก่าที่ไม่เกี่ยวข้อง',
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รับผิดชอบ Performance ภาพรวมของระบบเดิม'
    ],
    deliverables: [
      'Source Code ที่รวมฟีเจอร์ใหม่แล้ว',
      'อัปเดตเอกสารระบบ (ถ้ามี)'
    ],
    acceptance: [
      'ฟีเจอร์ใหม่สามารถทำงานได้ตามกำหนด',
      'ฟีเจอร์ใหม่สามารถเชื่อมต่อกับบัญชีผู้ใช้เดิมได้'
    ],
    risks: [
      'ความเสี่ยงงานงอก: ฟีเจอร์ใหม่ต้องการข้อมูลจากฟีเจอร์เก่าที่ไม่ได้เก็บไว้ตั้งแต่แรก'
    ]
  },
  'Support/Bug fix': {
    questions: [
      'ควรยืนยันขั้นตอนการทำซ้ำปัญหา (Steps to reproduce)',
      'ควรยืนยันสิ่งที่คาดหวัง (Expected behavior) และสิ่งที่เกิดขึ้นจริง (Actual behavior)',
      'ควรยืนยันว่าปัญหานี้เกิดขึ้นกับผู้ใช้ทุกคน หรือเฉพาะบางคน/บางอุปกรณ์'
    ],
    inScope: [
      'อาจต้องรวมการสืบสวนและจำลองปัญหา (Investigation & Reproduction)',
      'อาจต้องรวมการแก้ไข Code เพื่อแก้ปัญหานั้น',
      'อาจต้องรวมการทดสอบหลังการแก้ (Verification)'
    ],
    outOfScope: [
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมการเพิ่มฟีเจอร์ใหม่ (ถ้าต้องการเพิ่มถือเป็น Change Request)',
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รับประกันปัญหาที่จะเกิดในอนาคตที่ไม่ได้เกี่ยวข้องกัน'
    ],
    deliverables: [
      'บันทึกการแก้ไขบั๊กและการเปลี่ยนแปลง',
      'Code ที่อัปเดต'
    ],
    acceptance: [
      'ไม่สามารถทำซ้ำปัญหาเดิมได้อีกบนสภาพแวดล้อมที่กำหนด'
    ],
    risks: [
      'ความเสี่ยงงานงอก: ปัญหาเกิดจากระบบภายนอก (Third-party API) ที่เราควบคุมไม่ได้',
      'ความเสี่ยงงานงอก: ไม่สามารถหาวิธีจำลองปัญหาให้เกิดได้ ทำให้แก้ไม่ถูกจุด'
    ]
  },
  'Maintenance': {
    questions: [
      'ควรยืนยันระยะเวลาสัญญา (รายเดือน, รายปี)',
      'ควรยืนยันขอบเขตการดูแล (ดูแล Server, อัปเดต Security, หรือแก้บั๊กด้วย)',
      'ควรยืนยัน SLA (Service Level Agreement) การตอบกลับและการแก้ไข'
    ],
    inScope: [
      'อาจต้องรวมการมอนิเตอร์สถานะระบบ (Uptime Monitoring)',
      'อาจต้องรวมการอัปเดตแพตช์ความปลอดภัยตามรอบเวลา',
      'อาจต้องรวมการทำ Backup ข้อมูลรายวัน/สัปดาห์'
    ],
    outOfScope: [
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมการเขียนโค้ดเพิ่มฟีเจอร์ใหม่',
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมค่าเซิร์ฟเวอร์หรือค่าโดเมน (เว้นแต่จะระบุไว้)'
    ],
    deliverables: [
      'รายงานสถานะระบบประจำเดือน',
      'บันทึกการทำ Backup'
    ],
    acceptance: [
      'ระบบพร้อมใช้งานตามเปอร์เซ็นต์ที่ตกลง (เช่น 99.9% Uptime)',
      'มีการส่งรายงานตามกำหนด'
    ],
    risks: [
      'ความเสี่ยงงานงอก: ลูกค้าใช้สิทธิ์ Maintenance มาขอให้ทำฟีเจอร์ใหม่ (ต้องแยกระหว่าง MA กับ CR ให้ชัดเจน)'
    ]
  },
  'อื่น ๆ': {
    questions: [
      'ควรยืนยันเป้าหมายหลักของงานนี้ให้ชัดเจนที่สุด',
      'ควรยืนยันเรื่องงบประมาณและระยะเวลาที่มีจำกัด'
    ],
    inScope: [
      'อาจต้องรวมสิ่งที่ลูกค้าขอโดยตรง'
    ],
    outOfScope: [
      'หากไม่รวมควรระบุให้ชัดว่า ไม่รวมอะไรบ้างเพื่อตีกรอบงานให้แคบลง'
    ],
    deliverables: [
      'ผลลัพธ์ของงานตามตกลง'
    ],
    acceptance: [
      'งานเสร็จตามวัตถุประสงค์หลัก'
    ],
    risks: [
      'ความเสี่ยงงานงอก: ความต้องการไม่ชัดเจนแต่แรก ทำให้เข้าใจไม่ตรงกัน'
    ]
  }
};

export function detectProjectType(rawRequest: string, currentType: string): string {
  if (currentType !== 'อื่น ๆ' && currentType !== '') {
    return currentType;
  }
  
  const text = rawRequest.toLowerCase();
  const ecomKeywords = ['ขายของ', 'ร้านค้า', 'สินค้า', 'ecommerce', 'e-commerce', 'online shop', 'shopping', 'ตะกร้า', 'ออเดอร์'];
  
  if (ecomKeywords.some(kw => text.includes(kw))) {
    return 'เว็บขายของ';
  }
  
  return currentType || 'อื่น ๆ';
}

export function generateBriefDocument(data: {
  raw_request: string;
  project_type: string;
  project: string;
  client: string;
  projectName: string;
}): string {
  const today = todayISO();
  const detectedType = detectProjectType(data.raw_request, data.project_type);
  const preset = projectPresets[detectedType] || projectPresets['อื่น ๆ'];

  const frontmatter = {
    type: 'brief',
    version: '1.0',
    status: 'draft',
    source: 'customer-request',
    project: data.project,
    client: data.client,
    created: today,
    updated: today,
    locked: false,
  };
  
  const yamlString = YAML.stringify(frontmatter).trim();
  let markdown = `---\n${yamlString}\n---\n\n`;

  markdown += `# ร่างความต้องการ: ${data.projectName}\n\n`;

  markdown += `## 1. คำขอลูกค้าต้นฉบับ (Raw Request)\n\n`;
  markdown += `> ${data.raw_request.replace(/\n/g, '\n> ')}\n\n`;

  markdown += `## 2. สิ่งที่เข้าใจจากคำขอ (Understanding)\n\n`;
  if (preset.understanding && preset.understanding.length > 0) {
    preset.understanding.forEach(item => {
      markdown += `- ${item}\n`;
    });
    markdown += `\n`;
  } else {
    markdown += `*ยังไม่ได้สรุป (กรอกข้อมูลจากความเข้าใจเบื้องต้น)*\n\n`;
  }

  markdown += `## 3. สิ่งที่ยืนยันแล้ว (Confirmed)\n\n`;
  markdown += `- ${data.raw_request.replace(/\n/g, ' ')}\n\n`;

  markdown += `## 4. สิ่งที่เป็นสมมติฐาน (Assumptions)\n\n`;
  if (preset.assumptions && preset.assumptions.length > 0) {
    preset.assumptions.forEach(item => {
      markdown += `- ${item}\n`;
    });
    markdown += `\n`;
  } else {
    markdown += `- \n\n`;
  }

  markdown += `## 5. สิ่งที่ยังไม่ชัด (Unclear Areas)\n\n`;
  if (preset.unclear && preset.unclear.length > 0) {
    preset.unclear.forEach(item => {
      markdown += `- ${item}\n`;
    });
    markdown += `\n`;
  } else {
    markdown += `- \n\n`;
  }

  markdown += `## 6. คำถามที่ควรถามลูกค้า (Questions to Ask)\n\n`;
  preset.questions.forEach(q => {
    markdown += `- [ ] ${q}\n`;
  });
  markdown += `- [ ] \n\n`;

  markdown += `## 7. สิ่งที่อาจอยู่ในขอบเขต (Likely In-Scope)\n\n`;
  preset.inScope.forEach(item => {
    markdown += `- ${item}\n`;
  });
  markdown += `- \n\n`;

  markdown += `## 8. สิ่งที่ควรระบุว่าไม่รวมในขอบเขต (Likely Out-of-Scope)\n\n`;
  preset.outOfScope.forEach(item => {
    markdown += `- ${item}\n`;
  });
  markdown += `- \n\n`;

  markdown += `## 9. ความเสี่ยงงานงอก (Scope Creep Risks)\n\n`;
  preset.risks.forEach(item => {
    markdown += `- ${item}\n`;
  });
  markdown += `- \n\n`;

  markdown += `## 10. ขั้นตอนถัดไป (Next Steps)\n\n`;
  markdown += `- [ ] รวบรวมคำตอบจากลูกค้า\n`;
  markdown += `- [ ] ยืนยันสมมติฐานและสิ่งที่ยังไม่ชัด\n`;
  markdown += `- [ ] จัดทำเอกสารขอบเขตงาน (Scope of Work)\n\n`;

  return markdown;
}

export function parseBriefToScope(markdown: string) {
  const rawMatch = markdown.match(/## 1\. คำขอลูกค้าต้นฉบับ \(Raw Request\)\n+> ([\s\S]*?)(\n+## 2|\n*$)/);
  const rawRequest = rawMatch ? rawMatch[1].replace(/\n> /g, '\n') : '';

  const inScopeMatch = markdown.match(/## 7\. สิ่งที่อาจอยู่ในขอบเขต \(Likely In-Scope\)\n+([\s\S]*?)(\n+## 8|\n*$)/);
  const inScope = inScopeMatch ? inScopeMatch[1] : '';

  const outOfScopeMatch = markdown.match(/## 8\. สิ่งที่ควรระบุว่าไม่รวมในขอบเขต \(Likely Out-of-Scope\)\n+([\s\S]*?)(\n+## 9|\n*$)/);
  const outOfScope = outOfScopeMatch ? outOfScopeMatch[1] : '';
  
  const assumptionsMatch = markdown.match(/## 4\. สิ่งที่เป็นสมมติฐาน \(Assumptions\)\n+([\s\S]*?)(\n+## 5|\n*$)/);
  const assumptions = assumptionsMatch ? assumptionsMatch[1] : '';

  const deliverablesMatch = markdown.match(/## สิ่งที่ต้องส่งมอบ \(Deliverables\)\n+([\s\S]*?)(\n+##|\n*$)/);
  const deliverables = deliverablesMatch ? deliverablesMatch[1] : '';

  return {
    project_overview: rawRequest.trim(),
    included_items: inScope.replace(/^- /gm, '').trim(),
    excluded_items: outOfScope.replace(/^- /gm, '').trim(),
    assumptions: assumptions.replace(/^- /gm, '').trim(),
    deliverables: deliverables.replace(/^- /gm, '').trim(),
  };
}
