import { ScopeDigestOutput } from './scopeDigestSchema';
import { buildScopeDigestPrompt } from './scopeDigestPrompt';
import { validateScopeDigest } from './scopeDigestValidator';
import { getRuleBasedFallback } from './scopeDigestFallback';
import { generateJson } from '../providers/aiProviderRouter';

export async function processScopeDigest(
  workspacePath: string,
  rawRequest: string,
  projectType?: string,
  existingContext?: string
): Promise<ScopeDigestOutput> {
  try {
    const prompt = buildScopeDigestPrompt(rawRequest, projectType, existingContext);
    
    // Attempt AI Generation via Provider Router
    const rawResponse = await generateJson(workspacePath, prompt);
    
    // validateScopeDigest expects a string to clean up any markdown blocks
    const jsonString = typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse);

    const validatedResult = validateScopeDigest(jsonString);
    validatedResult.is_fallback = false;
    return validatedResult;

  } catch (error) {
    console.error("AI Scope Digest failed, falling back to rule-based:", error);
    // On error (disabled, network, validation), fallback
    const fallback = getRuleBasedFallback(rawRequest, projectType);
    return fallback;
  }
}
