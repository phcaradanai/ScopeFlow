import { generateJsonWithTrace } from './providers/aiProviderRouter';

export interface DocumentMergeAssistantResult {
  markdown: string;
  summary: string;
  provider?: string;
  model?: string;
}

function stripCodeFence(value: string) {
  return value
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function normalizeMergeResponse(result: any): { markdown: string; summary: string } {
  if (typeof result === 'string') {
    return { markdown: stripCodeFence(result), summary: 'AI merged existing content with the new draft.' };
  }

  const markdown = result?.markdown || result?.updated_markdown || result?.content || '';
  const summary = result?.summary || result?.change_summary || 'AI merged existing content with the new draft.';

  if (!markdown || typeof markdown !== 'string') {
    throw new Error('AI response did not include markdown');
  }

  return { markdown: stripCodeFence(markdown), summary: String(summary) };
}

export async function mergeDocumentWithAi(
  workspacePath: string,
  params: {
    existingMarkdown: string;
    newDraftMarkdown: string;
    documentKind: string;
    instruction?: string;
  }
): Promise<DocumentMergeAssistantResult> {
  const prompt = `You are ScopeFlow's document merge assistant. Return ONLY valid JSON.

Task:
Merge an existing ${params.documentKind} markdown document with a newly generated draft.

Rules:
- Preserve YAML frontmatter from the existing document unless the new draft clearly has missing useful fields.
- Preserve approval, locked, audit, evidence, customer-confirmed, and acceptance status fields from the existing document.
- Do not delete important existing content.
- Add new useful details from the new draft.
- Keep markdown clean and usable in ScopeFlow.
- Do not invent customer approvals.
- If the existing document is locked or approved, keep those fields unchanged and append a proposed-update section instead of silently changing approved content.
- Return JSON shape: {"markdown":"...full updated markdown...", "summary":"...short Thai summary..."}

Extra instruction:
${params.instruction || 'Merge safely and prefer preserving existing decisions.'}

Existing document:
<<<EXISTING_MARKDOWN
${params.existingMarkdown}
EXISTING_MARKDOWN

New draft:
<<<NEW_DRAFT_MARKDOWN
${params.newDraftMarkdown}
NEW_DRAFT_MARKDOWN`;

  const routed = await generateJsonWithTrace(workspacePath, prompt);
  const normalized = normalizeMergeResponse(routed.result);

  return {
    ...normalized,
    provider: routed.providerName,
    model: routed.model,
  };
}

export function mergeDocumentDeterministically(existingMarkdown: string, newDraftMarkdown: string, label = 'Generated update') {
  const timestamp = new Date().toISOString();
  const trimmedExisting = existingMarkdown.trimEnd();
  const trimmedDraft = newDraftMarkdown.trim();

  return `${trimmedExisting}\n\n---\n\n## ${label}\n\n> Added by ScopeFlow on ${timestamp}. Review before treating this as approved customer scope.\n\n${trimmedDraft}\n`;
}
