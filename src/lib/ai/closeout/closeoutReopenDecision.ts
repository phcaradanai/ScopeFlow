export interface CloseoutReopenDecisionOption {
  id: string;
  label: string;
  description: string;
}

export const CLOSEOUT_REOPEN_DECISION_OPTIONS: CloseoutReopenDecisionOption[] = [
  {
    id: 'reject_request',
    label: 'Reject request',
    description: 'ปฏิเสธคำขอ เพราะอยู่นอก scope หรือไม่ควรแก้หลัง sign-off',
  },
  {
    id: 'quote_change_request',
    label: 'Quote as Change Request',
    description: 'ออกใบเสนอราคา CR แยกก่อนเริ่มงานเพิ่ม',
  },
  {
    id: 'create_new_scope',
    label: 'Create new scope',
    description: 'เปิด scope/brief ใหม่ ไม่ปนกับ baseline ที่ปิดไปแล้ว',
  },
  {
    id: 'need_more_information',
    label: 'Need more information',
    description: 'ถามข้อมูลเพิ่มก่อนตัดสินใจ reject/quote/create scope',
  },
];

export function buildCloseoutReopenDecisionMarkdown(): string {
  return [
    '## Decision',
    '',
    ...CLOSEOUT_REOPEN_DECISION_OPTIONS.flatMap(option => [
      `- [ ] ${option.label}`,
      `  - ${option.description}`,
    ]),
    '',
    '> Choose exactly one decision before starting any work after final close.',
    '',
  ].join('\n');
}
