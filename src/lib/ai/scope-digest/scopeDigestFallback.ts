import { ScopeDigestOutput } from './scopeDigestSchema';
import { projectPresets, detectProjectType } from '../../brief-builder';

export function getRuleBasedFallback(rawRequest: string, projectType?: string): ScopeDigestOutput {
  const detectedType = detectProjectType(rawRequest, projectType || 'อื่น ๆ');
  const preset = projectPresets[detectedType] || projectPresets['อื่น ๆ'];

  return {
    detected_project_type: detectedType !== 'อื่น ๆ' ? detectedType : 'ทั่วไป',
    confidence: "low",
    understanding: preset?.understanding || ['ลูกค้ามีความต้องการพัฒนาโครงการหรือระบบใหม่'],
    confirmed_facts: ['(ข้อความจากลูกค้า): ' + rawRequest.slice(0, 100) + '...'],
    assumptions: preset?.assumptions || ['อาจต้องใช้ข้อมูลเพิ่มเติมในการประเมินขอบเขตที่ชัดเจน'],
    unclear_points: preset?.unclear || ['ยังไม่ทราบรายละเอียดที่ครบถ้วนจากข้อความเพียงอย่างเดียว'],
    questions_to_ask: preset?.questions || [
      'กรุณาให้ข้อมูลเพิ่มเติมเกี่ยวกับเป้าหมายของโครงการ',
      'กลุ่มผู้ใช้งานเป้าหมายคือใคร?',
      'มีตัวอย่างระบบที่อยากได้หรือไม่?'
    ],
    likely_in_scope: preset?.inScope || ['ฟีเจอร์พื้นฐานตามที่ตกลงกัน'],
    likely_out_of_scope: preset?.outOfScope || ['หากไม่ระบุ จะถือว่าไม่รวมอยู่ในขอบเขต'],
    scope_creep_risks: preset?.risks || ['ความเสี่ยงงานบานปลายหากไม่สรุปฟีเจอร์ให้ชัดเจนเป็นลายลักษณ์อักษร'],
    suggested_next_documents: ['brief-v1.0.md'],
    is_fallback: true,
  };
}
