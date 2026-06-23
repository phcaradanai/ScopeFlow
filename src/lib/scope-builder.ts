import YAML from 'yaml';

export interface ScopeFormData {
  title: string;
  project_overview: string;
  included_items: string;
  excluded_items: string;
  deliverables: string;
  acceptance_criteria: string;
  assumptions: string;
}

export function generateScopeMarkdown(data: ScopeFormData, documentId: string): string {
  const frontmatter = {
    title: data.title || 'ขอบเขตงาน (Scope of Work)',
    type: 'scope',
    id: documentId,
    form_data: data,
  };
  
  const yamlString = YAML.stringify(frontmatter).trim();
  let markdown = `---\n${yamlString}\n---\n\n`;

  markdown += `# ${frontmatter.title}\n\n`;

  if (data.project_overview) {
    markdown += `## 1. ความเป็นมาและวัตถุประสงค์ (Project Overview)\n\n${data.project_overview.trim()}\n\n`;
  }

  if (data.included_items) {
    markdown += `## 2. ขอบเขตที่รวมอยู่ในโครงการ (In-Scope)\n\n${data.included_items.trim()}\n\n`;
  }

  if (data.excluded_items) {
    markdown += `## 3. สิ่งที่อยู่นอกเหนือขอบเขต (Out-of-Scope)\n\n${data.excluded_items.trim()}\n\n`;
  }

  if (data.deliverables) {
    markdown += `## 4. สิ่งที่ต้องส่งมอบ (Deliverables)\n\n${data.deliverables.trim()}\n\n`;
  }

  if (data.acceptance_criteria) {
    markdown += `## 5. เกณฑ์การตรวจรับ (Acceptance Criteria)\n\n${data.acceptance_criteria.trim()}\n\n`;
  }

  if (data.assumptions) {
    markdown += `## 6. ข้อตกลงและเงื่อนไขเพิ่มเติม (Assumptions & Conditions)\n\n${data.assumptions.trim()}\n\n`;
  }

  return markdown;
}

export function parseScopeFormData(markdown: string): ScopeFormData | null {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n+/;
  const match = markdown.match(frontmatterRegex);
  if (!match) return null;

  try {
    const parsed = YAML.parse(match[1]);
    if (parsed && parsed.form_data) {
      return parsed.form_data as ScopeFormData;
    }
  } catch (err) {
    console.error("Failed to parse frontmatter data:", err);
  }
  return null;
}
