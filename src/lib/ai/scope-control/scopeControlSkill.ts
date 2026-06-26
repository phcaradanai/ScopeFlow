import type { ScopeDigestOutput } from '../scope-digest/scopeDigestSchema';
import { generateJson } from '../providers/aiProviderRouter';
import { buildScopeControlPrompt } from './scopeControlPrompt';
import { getRuleBasedScopeControl } from './scopeControlFallback';
import { validateScopeControl } from './scopeControlValidator';
import type { ScopeControlOutput } from './scopeControlSchema';

export async function processScopeControl(
  workspacePath: string,
  rawRequest: string,
  digest: ScopeDigestOutput,
  existingScopeDraft?: string
): Promise<ScopeControlOutput> {
  try {
    const prompt = buildScopeControlPrompt(rawRequest, digest, existingScopeDraft);
    const rawResponse = await generateJson(workspacePath, prompt);
    const jsonString = typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse);
    const validated = validateScopeControl(jsonString);
    validated.is_fallback = false;
    return validated;
  } catch (error) {
    console.error('AI Scope Control failed, falling back to rule-based:', error);
    return getRuleBasedScopeControl(rawRequest, digest);
  }
}
