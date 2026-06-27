import type { AcceptanceArtifact } from './acceptanceArtifact';

const START_MARKER = '<!-- acceptance-artifact:start -->';
const END_MARKER = '<!-- acceptance-artifact:end -->';

function list(items: string[], empty: string): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map(item => `- ${item}`).join('\n');
}

export function buildAcceptanceArtifactMarkdown(artifact: AcceptanceArtifact): string {
  const criteriaRows = artifact.acceptance_criteria.length === 0
    ? '| - | - | - | - |\n|---|---|---|---|\n| ยังไม่มี acceptance criteria | - | - | - |'
    : [
      '| Criteria | Status | Evidence | Note |',
      '|---|---|---|---|',
      ...artifact.acceptance_criteria.map(item => `| ${item.criteria} | ${item.status} | ${item.evidence || '-'} | ${item.note || '-'} |`),
    ].join('\n');

  return `${START_MARKER}
# ${artifact.title}

## Acceptance Metadata

- Artifact ID: **${artifact.artifact_id}**
- Status: **${artifact.status}**
- Sign-off Required: **${artifact.signoff_required ? 'yes' : 'no'}**
- Can Close Work: **${artifact.can_close_work ? 'yes' : 'no'}**
- Sign-off By: **${artifact.signoff_by || '-'}**
- Sign-off At: **${artifact.signoff_at || '-'}**
- Sign-off Ref: **${artifact.signoff_ref || '-'}**

## Baseline References

- Scope Baseline: **${artifact.source_scope_baseline_path}**

### Change Baselines

${list(artifact.source_change_baseline_paths, 'ไม่มี Change Baseline ที่อ้างอิง')}

## Delivered Items

${list(artifact.delivered_items, 'ยังไม่มีรายการส่งมอบ')}

## Acceptance Criteria Checks

${criteriaRows}

## Pending Items

${list(artifact.pending_items, 'ไม่มีรายการค้างหลัก')}

## Out of Scope Items

${list(artifact.out_of_scope_items, 'ไม่มีรายการ out-of-scope ที่ต้องย้ำ')}

## Change Request Required Items

${list(artifact.change_request_required_items, 'ไม่มีรายการที่ต้องเปิด CR/DCR เพิ่ม')}

## Acceptance Summary

- Passed Criteria: **${artifact.passed_count}**
- Pending Items: **${artifact.pending_count}**
- Failed Criteria: **${artifact.failed_count}**

## Warnings

${list(artifact.warnings, 'ไม่มี warning หลัก')}

## Recommended Next Action

${artifact.recommended_next_action}
${END_MARKER}`;
}

export function injectAcceptanceArtifactMarkdown(markdown: string, artifact: AcceptanceArtifact): string {
  const section = buildAcceptanceArtifactMarkdown(artifact);
  const existingSectionPattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`, 'm');

  if (existingSectionPattern.test(markdown)) {
    return markdown.replace(existingSectionPattern, section);
  }

  return `${markdown.trimEnd()}\n\n${section}\n`;
}
