import { describe, it, expect } from 'vitest';
import { generateBriefDocument, parseBriefToScope, detectProjectType } from '../brief-builder';

describe('brief-builder', () => {
  it('generates a brief document with frontmatter and sections', () => {
    const rawRequest = 'อยากได้เว็บขายของ มีระบบตะกร้า จ่ายบัตรเครดิตได้';
    const md = generateBriefDocument({
      raw_request: rawRequest,
      project_type: 'เว็บขายของ',
      project: 'PROJ-01',
      client: 'CLI-01',
      projectName: 'Website E-commerce',
    });

    expect(md).toContain('type: brief');
    expect(md).toContain('status: draft');
    expect(md).toContain('project: PROJ-01');
    expect(md).toContain('# ร่างความต้องการ: Website E-commerce');
    expect(md).toContain(`> ${rawRequest}`);
    
    // Check preset injections for E-Commerce
    expect(md).toContain('ลูกค้าต้องการระบบหรือแอปสำหรับขายสินค้าออนไลน์');
    expect(md).toContain('อาจต้องรวมระบบตะกร้าสินค้าและการสั่งซื้อ (Cart & Checkout)');
    expect(md).toContain('payment gateway fee/setup');
    expect(md).toContain('payment/shipping requirements unclear');
  });

  it('auto-detects project type based on keywords', () => {
    expect(detectProjectType('อยากทำแอปขายของ online', 'อื่น ๆ')).toBe('เว็บขายของ');
    expect(detectProjectType('ระบบจัดการตะกร้าสินค้า', '')).toBe('เว็บขายของ');
    expect(detectProjectType('แอปขายของ online', 'อื่น ๆ')).toBe('เว็บขายของ');
    expect(detectProjectType('ระบบบริษัททั่วไป', 'อื่น ๆ')).toBe('อื่น ๆ');
    // should not override if user already specified a type other than "อื่น ๆ" or empty
    expect(detectProjectType('แอปขายของ online', 'เว็บไซต์บริษัท')).toBe('เว็บไซต์บริษัท');
  });

  it('generates support preset with correct questions', () => {
    const md = generateBriefDocument({
      raw_request: 'เข้าระบบไม่ได้ มันหมุนติ้วๆ',
      project_type: 'Support/Bug fix',
      project: 'PROJ-02',
      client: 'CLI-02',
      projectName: 'Fix Login',
    });

    expect(md).toContain('ควรยืนยันขั้นตอนการทำซ้ำปัญหา (Steps to reproduce)');
    expect(md).toContain('ควรยืนยันสิ่งที่คาดหวัง (Expected behavior) และสิ่งที่เกิดขึ้นจริง (Actual behavior)');
  });

  it('suggestions are phrased as guidance, not confirmed facts', () => {
    const md = generateBriefDocument({
      raw_request: 'test',
      project_type: 'เว็บไซต์บริษัท',
      project: 'PROJ-03',
      client: 'CLI-03',
      projectName: 'Test',
    });

    // Check wording
    expect(md).toContain('ควรยืนยัน');
    expect(md).toContain('อาจต้องรวม');
    expect(md).toContain('หากไม่รวมควรระบุให้ชัดว่า');
  });

  it('can parse a generated brief to prefill scope data', () => {
    const md = generateBriefDocument({
      raw_request: 'Test request\nLine 2',
      project_type: 'เว็บไซต์บริษัท',
      project: 'PROJ-04',
      client: 'CLI-04',
      projectName: 'Parse Test',
    });

    const parsed = parseBriefToScope(md);
    
    expect(parsed.project_overview).toBe('Test request\nLine 2');
    expect(parsed.included_items).toContain('อาจต้องรวมหน้าแรก (Home)');
    expect(parsed.excluded_items).toContain('ไม่รวมการถ่ายภาพสินค้าหรือถ่ายทำวีดีโอใหม่');
  });
});
