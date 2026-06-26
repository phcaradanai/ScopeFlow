import type { ScopeDigestOutput } from '../scope-digest/scopeDigestSchema';
import type { ScopeControlOutput, ScopeControlItem, EstimationFactor, PricingModel } from './scopeControlSchema';

function toItems(items: string[] | undefined, confidence: ScopeControlItem['confidence'], fallbackEvidence: string): ScopeControlItem[] {
  return (items || [])
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => ({
      item,
      confidence,
      evidence: confidence === 'confirmed' ? fallbackEvidence : 'มาจากการวิเคราะห์เบื้องต้น ต้องยืนยันกับลูกค้า',
      boundary_note: confidence === 'confirmed'
        ? 'สามารถนำไปเขียนเป็นขอบเขตได้ แต่ยังต้องมี acceptance criteria ที่ตรวจรับได้'
        : 'ห้ามใช้เป็นขอบเขตราคา fixed-price จนกว่าจะได้รับการยืนยัน',
    }));
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

function detectEcommerce(text: string): boolean {
  return ['ขายของ', 'ร้านค้า', 'สินค้า', 'ตะกร้า', 'checkout', 'payment', 'stock', 'สต็อก', 'ออเดอร์', 'shipping'].some(keyword => text.toLowerCase().includes(keyword));
}

function detectMaintenance(text: string): boolean {
  return ['maintenance', 'ma', 'ดูแล', 'ซ่อมบำรุง', 'monitor', 'backup', 'sla'].some(keyword => text.toLowerCase().includes(keyword));
}

function detectExistingSystemWork(text: string): boolean {
  return ['ระบบเดิม', 'แก้ระบบ', 'เพิ่ม feature', 'bug', 'บั๊ก', 'source code', 'server'].some(keyword => text.toLowerCase().includes(keyword));
}

function ecommerceQuestions(): string[] {
  return [
    'มีสินค้าประมาณกี่รายการ และมี variant เช่น สี/ไซซ์หรือไม่',
    'ต้องมีระบบสมาชิก/login หรือสั่งซื้อแบบ guest ได้',
    'ต้องรับชำระเงินผ่านช่องทางใด และมี merchant/payment gateway แล้วหรือยัง',
    'การตัดสต็อกเกิดตอนใด: ตอนกดสั่งซื้อ ตอนชำระเงินสำเร็จ หรือให้แอดมินยืนยัน',
    'ต้องมีการคิดค่าส่งแบบใด และต้องเชื่อมต่อขนส่งภายนอกหรือไม่',
    'ต้อง import ข้อมูลสินค้าเดิมหรือให้ทีมงานกรอกเอง',
    'รายงานที่ต้องการมีอะไรบ้าง และต้อง export Excel/PDF หรือไม่',
    'promotion/coupon/discount รวมอยู่ใน scope แรกหรือไม่',
  ];
}

function ecommerceBoundaries(): string[] {
  return [
    'ไม่รวมค่า payment gateway, merchant account, transaction fee และขั้นตอนสมัครบริการภายนอก',
    'ไม่รวมการกรอกหรือ import ข้อมูลสินค้า หากไม่ได้ระบุจำนวนและรูปแบบข้อมูลล่วงหน้า',
    'ไม่รวม mobile app หากไม่ได้ระบุชัดว่าเป็น deliverable',
    'ไม่รวม promotion/coupon ขั้นสูง หรือ campaign rule ที่ไม่ได้ระบุในเอกสาร scope',
    'ไม่รวม custom report เพิ่มเติมนอกเหนือจากรายการรายงานที่ระบุใน TOR',
    'ไม่รวมการเชื่อมต่อ ERP/POS/accounting/shipping ภายนอก หากไม่ได้ระบุ provider และ API ที่ใช้',
  ];
}

function defaultQuestions(): string[] {
  return [
    'เป้าหมายหลักของงานนี้คืออะไร และจะถือว่าสำเร็จเมื่อใด',
    'ผู้ใช้งานหลักคือใคร และมีบทบาท/สิทธิ์กี่ระดับ',
    'รายการฟีเจอร์ใดเป็น must-have และรายการใดเป็น nice-to-have',
    'มีระบบเดิม ข้อมูลเดิม หรือ third-party ที่ต้องเชื่อมต่อหรือไม่',
    'กำหนดส่ง งบประมาณ และข้อจำกัดที่ลูกค้ารับได้คืออะไร',
  ];
}

function defaultBoundaries(): string[] {
  return [
    'ไม่รวมงานนอกเหนือจากรายการฟีเจอร์ที่ระบุในเอกสาร Scope/TOR',
    'การเพิ่มฟีเจอร์ใหม่หลังอนุมัติ scope ต้องทำเป็น Change Request และประเมินเวลา/ค่าใช้จ่ายใหม่',
    'ไม่รวมการย้ายข้อมูลหรือเชื่อมต่อระบบภายนอก หากไม่ได้ระบุแหล่งข้อมูล รูปแบบข้อมูล และผู้รับผิดชอบชัดเจน',
    'ไม่รวมค่าใช้จ่ายบริการภายนอก เช่น hosting, domain, SMS, email, payment, license เว้นแต่ระบุไว้',
  ];
}

function buildEstimationFactors(rawRequest: string, digest: ScopeDigestOutput): EstimationFactor[] {
  const text = `${rawRequest}\n${digest.likely_in_scope.join('\n')}`;
  const factors: EstimationFactor[] = [];

  if (detectEcommerce(text)) {
    factors.push(
      { module: 'Product / Catalog Management', complexity: 'medium', estimated_man_hours_min: 24, estimated_man_hours_max: 48, assumptions: ['มีสินค้าและหมวดหมู่พื้นฐาน', 'ยังไม่รวม variant/import ซับซ้อน'], risk_buffer_percent: 20 },
      { module: 'Cart / Checkout / Order Flow', complexity: 'medium', estimated_man_hours_min: 32, estimated_man_hours_max: 64, assumptions: ['flow สั่งซื้อพื้นฐาน', 'ยังไม่รวม promotion rule ขั้นสูง'], risk_buffer_percent: 25 },
      { module: 'Payment / Stock / Shipping Rules', complexity: 'high', estimated_man_hours_min: 40, estimated_man_hours_max: 96, assumptions: ['ขึ้นกับ provider และ business rule ที่ลูกค้ายืนยัน'], risk_buffer_percent: 35 },
      { module: 'Admin / Report', complexity: 'medium', estimated_man_hours_min: 24, estimated_man_hours_max: 56, assumptions: ['รายงานพื้นฐานตามรายการที่ระบุเท่านั้น'], risk_buffer_percent: 25 },
    );
    return factors;
  }

  if (detectMaintenance(text)) {
    factors.push(
      { module: 'Monitoring / Backup / Maintenance Setup', complexity: 'medium', estimated_man_hours_min: 16, estimated_man_hours_max: 40, assumptions: ['มีสิทธิ์เข้าถึง server และระบบเดิมครบ'], risk_buffer_percent: 25 },
      { module: 'SLA / Monthly Operation', complexity: 'medium', estimated_man_hours_min: 8, estimated_man_hours_max: 32, assumptions: ['คิดเป็น recurring retainer ตามระดับ SLA'], risk_buffer_percent: 20 },
    );
    return factors;
  }

  if (detectExistingSystemWork(text)) {
    factors.push(
      { module: 'Discovery / Code & System Audit', complexity: 'high', estimated_man_hours_min: 16, estimated_man_hours_max: 48, assumptions: ['ต้องเห็น source code, database, server, logs ก่อนประเมินงานแก้จริง'], risk_buffer_percent: 40 },
      { module: 'Implementation / Fix / Verification', complexity: 'high', estimated_man_hours_min: 24, estimated_man_hours_max: 80, assumptions: ['ประเมินหลัง discovery เท่านั้น'], risk_buffer_percent: 40 },
    );
    return factors;
  }

  const inScope = digest.likely_in_scope.filter(Boolean);
  if (inScope.length > 0) {
    inScope.slice(0, 5).forEach(item => {
      factors.push({
        module: item,
        complexity: 'medium',
        estimated_man_hours_min: 8,
        estimated_man_hours_max: 24,
        assumptions: ['เป็นรายการขอบเขตเบื้องต้น ต้องแตก requirement และ acceptance criteria เพิ่มก่อนเสนอราคา'],
        risk_buffer_percent: 25,
      });
    });
  } else {
    factors.push({
      module: 'Discovery / Requirement Clarification',
      complexity: 'medium',
      estimated_man_hours_min: 4,
      estimated_man_hours_max: 16,
      assumptions: ['ข้อมูลยังไม่พอสำหรับแตก scope งานพัฒนา'],
      risk_buffer_percent: 30,
    });
  }

  return factors;
}

function suggestedPricingModel(rawRequest: string, digest: ScopeDigestOutput): PricingModel {
  const text = `${rawRequest}\n${digest.unclear_points.join('\n')}\n${digest.scope_creep_risks.join('\n')}`;
  if (detectMaintenance(text)) return 'retainer';
  if (detectExistingSystemWork(text)) return 'time_and_material';
  if (digest.unclear_points.length >= 4 || digest.scope_creep_risks.length >= 3) return 'phase_based';
  return 'fixed_price';
}

export function getRuleBasedScopeControl(rawRequest: string, digest: ScopeDigestOutput): ScopeControlOutput {
  const text = `${rawRequest}\n${digest.detected_project_type}\n${digest.likely_in_scope.join('\n')}`;
  const ecommerce = detectEcommerce(text);
  const mustAsk = unique([
    ...digest.questions_to_ask,
    ...digest.unclear_points.map(item => `ยืนยัน: ${item}`),
    ...(ecommerce ? ecommerceQuestions() : defaultQuestions()),
  ]).slice(0, 14);

  const boundaryClauses = unique([
    ...digest.likely_out_of_scope,
    ...(ecommerce ? ecommerceBoundaries() : defaultBoundaries()),
  ]).slice(0, 14);

  const readinessScore = Math.max(5, Math.min(100,
    35 +
    digest.confirmed_facts.length * 8 +
    digest.likely_in_scope.length * 5 -
    digest.unclear_points.length * 10 -
    digest.scope_creep_risks.length * 8
  ));

  const readiness_to_quote = readinessScore >= 75 && mustAsk.length <= 3
    ? 'ready'
    : readinessScore >= 45
      ? 'risky'
      : 'not_ready';

  const estimationFactors = buildEstimationFactors(rawRequest, digest);
  const pricingModel = suggestedPricingModel(rawRequest, digest);

  return {
    readiness_to_quote,
    readiness_score: readinessScore,
    confirmed_scope_items: toItems(digest.confirmed_facts, 'confirmed', 'ลูกค้าระบุไว้โดยตรงในคำขอหรือข้อมูลที่ให้มา'),
    assumed_scope_items: toItems(digest.assumptions.concat(digest.likely_in_scope), 'assumed', 'มาจากการวิเคราะห์'),
    ambiguous_scope_items: toItems(digest.unclear_points, 'ambiguous', 'ยังไม่ชัดเจน'),
    must_ask_before_quote: mustAsk,
    optional_questions: unique([
      'ลูกค้ามีตัวอย่างระบบหรือ reference ที่ต้องการหรือไม่',
      'ลูกค้าต้องการแบ่งส่งมอบเป็น phase หรือส่งมอบครั้งเดียว',
      'ลูกค้ามีข้อจำกัดด้านเทคโนโลยี/hosting/security หรือไม่',
    ]),
    suggested_boundary_clauses: boundaryClauses,
    scope_creep_traps: unique(digest.scope_creep_risks.concat(digest.likely_in_scope)).slice(0, 8).map(item => ({
      item,
      why_risky: 'รายการนี้อาจถูกตีความกว้างกว่าที่ระบุ ทำให้เกิดงานเพิ่มโดยไม่รู้ตัว',
      how_to_limit: 'ระบุรายการย่อย ขอบเขต เงื่อนไข และจำนวนรอบแก้ไขให้ชัดใน TOR/Scope',
      change_request_trigger: 'หากลูกค้าขอเพิ่มรายการย่อย เงื่อนไขใหม่ integration ใหม่ หรือเปลี่ยน flow หลังอนุมัติ ให้เปิด Change Request',
    })),
    acceptance_risks: digest.likely_in_scope.slice(0, 8).map(item => ({
      scope_item: item,
      missing_acceptance_criteria: 'ยังไม่มีเกณฑ์ตรวจรับที่วัดได้ชัดเจน',
      suggested_acceptance_criteria: `ลูกค้าตรวจรับเมื่อ "${item}" ทำงานได้ตาม scenario ที่ตกลงและไม่มีข้อผิดพลาดระดับ blocking`,
    })),
    tor_sections: {
      objective: digest.understanding.length ? digest.understanding : ['ระบุเป้าหมายหลักของงานจากคำตอบลูกค้าเพิ่มเติม'],
      deliverables: digest.suggested_next_documents.length ? digest.suggested_next_documents : ['Scope of Work', 'Quotation', 'Acceptance Checklist'],
      requirements: digest.likely_in_scope,
      acceptance_criteria: digest.likely_in_scope.map(item => `ตรวจรับ ${item} ตาม scenario ที่ตกลงไว้`),
      exclusions: boundaryClauses,
    },
    estimation_factors: estimationFactors,
    cost_reasoning: {
      pricing_blockers: readiness_to_quote === 'ready' ? [] : mustAsk.slice(0, 8),
      cost_drivers: unique([
        'จำนวนฟีเจอร์และ business rule',
        'จำนวน integration กับระบบภายนอก',
        'ความชัดเจนของ acceptance criteria',
        'ข้อมูลเดิมที่ต้อง migrate/import',
        'ระดับ SLA, security, และ reporting',
      ]),
      suggested_pricing_model: pricingModel,
      why: pricingModel === 'fixed_price'
        ? 'ข้อมูลค่อนข้างชัด สามารถตีราคาแบบ fixed price ได้หลังล็อก scope และ acceptance criteria'
        : pricingModel === 'phase_based'
          ? 'ยังมีความไม่ชัดหลายจุด ควรแบ่ง discovery/phase เพื่อจำกัดความเสี่ยงก่อน commit ราคาทั้งก้อน'
          : pricingModel === 'retainer'
            ? 'ลักษณะงานเป็นงานดูแลต่อเนื่อง เหมาะกับรายเดือน/รายปีพร้อม SLA'
            : 'งานมีความไม่แน่นอนสูง โดยเฉพาะระบบเดิมหรือ bug fix ควรคิดตามเวลาและขอบเขตที่พิสูจน์ได้',
    },
    recommendation: readiness_to_quote === 'ready'
      ? 'สามารถเตรียมใบเสนอราคาได้ แต่ควรแนบ boundary clauses และ acceptance criteria ให้ครบ'
      : readiness_to_quote === 'risky'
        ? 'ยังเสนอราคาได้แบบ phase/discovery หรือช่วงราคา แต่ไม่ควร fixed price ทั้งก้อนจนกว่าจะตอบคำถามสำคัญ'
        : 'ยังไม่ควรเสนอราคา ควรถามคำถามสำคัญและล็อกขอบเขตก่อน เพื่อป้องกันงานงอกและราคาผิด',
    is_fallback: true,
  };
}
