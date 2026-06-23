import { describe, it, expect } from 'vitest';
import {
  generateScopeDocument,
  generateQuotationDocument,
  generateCRDocument,
  generateDCRDocument,
  generateSupportRequestDocument,
  generateAcceptanceChecklist,
} from '../templates';

describe('templates.ts', () => {
  const testData = {
    project: 'proj-1',
    client: 'cli-1',
    author: 'Test User',
  };

  function parseFrontmatter(content: string): Record<string, any> {
    const lines = content.split('\n');
    let inFrontmatter = false;
    const data: Record<string, any> = {};

    for (const line of lines) {
      if (line === '---') {
        if (inFrontmatter) break; // End of frontmatter
        inFrontmatter = true;
        continue;
      }
      if (inFrontmatter) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
          const key = line.slice(0, colonIdx).trim();
          let value = line.slice(colonIdx + 1).trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          // Type casting
          if (value === 'true') data[key] = true;
          else if (value === 'false') data[key] = false;
          else if (!isNaN(Number(value)) && value !== '') data[key] = Number(value);
          else data[key] = value;
        }
      }
    }
    return data;
  }

  function expectValidFrontmatter(content: string, expectedType: string) {
    const yaml = parseFrontmatter(content);
    expect(yaml.type).toBe(expectedType);
    expect(yaml.project).toBe('proj-1');
    expect(yaml.client).toBe('cli-1');
    expect(yaml.status).toBe('draft');
    expect(yaml.locked).toBe(false);
  }

  it('generates valid Quotation', () => {
    const doc = generateQuotationDocument(testData);
    expectValidFrontmatter(doc, 'quotation');
    expect(doc).toContain('# ใบเสนอราคา');
    expect(doc).toContain('## ข้อมูลลูกค้า');
    expect(doc).toContain('## สรุปราคา');
  });

  it('generates valid CR', () => {
    const doc = generateCRDocument({ ...testData, crNumber: 'CR-001', title: 'Test CR' });
    expectValidFrontmatter(doc, 'change-request');
    expect(doc).toMatch(/cr_number: "CR-001"|cr_number: CR-001/);
    expect(doc).toContain('# คำขอเปลี่ยนแปลงขอบเขตงาน: CR-001 — Test CR');
    expect(doc).toContain('## ผลกระทบต่อขอบเขตงาน');
    expect(doc).toContain('## ผลกระทบต่อค่าใช้จ่าย');
  });

  it('generates valid DCR', () => {
    const doc = generateDCRDocument({
      ...testData,
      dcrNumber: 'DCR-001',
      changeKind: 'database',
      title: 'Test DCR'
    });
    expectValidFrontmatter(doc, 'development-change-request');
    expect(doc).toMatch(/dcr_number: "DCR-001"|dcr_number: DCR-001/);
    expect(doc).toMatch(/change_kind: "database"|change_kind: database/);
    expect(doc).toContain('# คำขอเปลี่ยนแปลงการพัฒนา: DCR-001 — Test DCR');
    expect(doc).toContain('## ผลกระทบต่อข้อมูลเดิม');
    expect(doc).toContain('## แผนการทดสอบ');
  });

  it('generates valid SUP', () => {
    const doc = generateSupportRequestDocument({
      ...testData,
      type: 'support-request',
      requestNumber: 'SUP-001',
      category: 'bug',
      title: 'Test SUP'
    });
    expectValidFrontmatter(doc, 'support-request');
    expect(doc).toMatch(/request_number: "SUP-001"|request_number: SUP-001/);
    expect(doc).toMatch(/category: "bug"|category: bug/);
    expect(doc).toContain('# แจ้งปัญหา/แจ้งซ่อม: SUP-001 — Test SUP');
    expect(doc).toContain('## ขั้นตอนการเกิดปัญหา');
    expect(doc).toContain('## การวิเคราะห์เบื้องต้น');
  });

  it('generates valid MA', () => {
    const doc = generateSupportRequestDocument({
      ...testData,
      type: 'ma-request',
      requestNumber: 'MA-001',
      category: 'maintenance',
      title: 'Test MA'
    });
    expectValidFrontmatter(doc, 'ma-request');
    expect(doc).toMatch(/request_number: "MA-001"|request_number: MA-001/);
    expect(doc).toContain('# แจ้งปัญหา/แจ้งซ่อม: MA-001 — Test MA');
  });

  it('generates valid Acceptance Checklist', () => {
    const doc = generateAcceptanceChecklist(testData);
    expectValidFrontmatter(doc, 'acceptance-checklist');
    expect(doc).toContain('# รายการตรวจรับงาน');
    expect(doc).toContain('## รายการตรวจรับด้านฟังก์ชัน');
    expect(doc).toContain('## สรุปผลการตรวจรับ');
  });
});
