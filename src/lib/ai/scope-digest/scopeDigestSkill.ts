import { ScopeDigestOutput } from './scopeDigestSchema';
import { buildScopeDigestPrompt } from './scopeDigestPrompt';
import { validateScopeDigest } from './scopeDigestValidator';
import { getRuleBasedFallback } from './scopeDigestFallback';
import { getAiSettings } from '../../settings';

export async function processScopeDigest(
  workspacePath: string,
  rawRequest: string,
  projectType?: string,
  existingContext?: string
): Promise<ScopeDigestOutput> {
  const settings = await getAiSettings(workspacePath);

  // If AI is disabled or mode is 'off', use rule-based fallback
  if (!settings.enabled || settings.mode === 'off') {
    return getRuleBasedFallback(rawRequest, projectType);
  }

  try {
    const prompt = buildScopeDigestPrompt(rawRequest, projectType, existingContext);
    
    // Ensure baseUrl doesn't have trailing slash for clean URL building
    const baseUrl = settings.baseUrl.replace(/\/$/, '');
    const apiUrl = `${baseUrl}/api/generate`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model || 'llama3', // default if empty
        prompt: prompt,
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.response) {
      throw new Error('No response from Ollama API');
    }

    const validatedResult = validateScopeDigest(data.response);
    return validatedResult;

  } catch (error) {
    console.error("AI Scope Digest failed, falling back to rule-based:", error);
    // On error (network, validation), fallback
    const fallback = getRuleBasedFallback(rawRequest, projectType);
    return fallback;
  }
}
