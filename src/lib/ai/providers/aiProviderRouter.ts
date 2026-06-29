import { getAiProviders } from './providerSettings';
import { getProviderApiKey } from './providerSecrets';
import { generateOllama, testOllamaConnection, fetchOllamaModels } from './ollamaProvider';
import { generateOpenAi, testOpenAiConnection, fetchOpenAiModels } from './openAiCompatibleProvider';
import { AiProvider, AiProviderAttemptTrace, AiProviderRoutedResult } from './types';

function isProviderUsable(provider: AiProvider): boolean {
  if (provider.enabled === false) return false;
  if (!provider.baseUrl?.trim()) return false;
  if (provider.type === 'ollama') return Boolean(provider.model?.trim());
  if (provider.type === 'openai-compatible') return Boolean(provider.model?.trim());
  return false;
}

function getProviderPriority(provider: AiProvider): number {
  return typeof provider.priority === 'number' ? provider.priority : Number.MAX_SAFE_INTEGER;
}

function buildCandidateProviders(providers: AiProvider[], activeProviderId: string, routingMode = 'priority-fallback'): AiProvider[] {
  const activeProvider = providers.find(provider => provider.id === activeProviderId);
  const usableProviders = providers.filter(isProviderUsable);

  if (routingMode === 'active-only') {
    return activeProvider && isProviderUsable(activeProvider) ? [activeProvider] : [];
  }

  const fallbackProviders = usableProviders
    .filter(provider => provider.id !== activeProviderId)
    .sort((a, b) => getProviderPriority(a) - getProviderPriority(b));

  if (activeProvider && isProviderUsable(activeProvider)) {
    return [activeProvider, ...fallbackProviders];
  }

  return fallbackProviders;
}

async function generateWithProvider(workspacePath: string, provider: AiProvider, prompt: string): Promise<any> {
  let apiKey: string | undefined;
  if (provider.apiKeyRef) {
    apiKey = await getProviderApiKey(workspacePath, provider.apiKeyRef);
  }

  if (provider.type === 'ollama') {
    return generateOllama(provider, prompt);
  } else if (provider.type === 'openai-compatible') {
    return generateOpenAi(provider, prompt, apiKey);
  }

  throw new Error(`Unsupported provider type: ${provider.type}`);
}

export async function generateJsonWithTrace(workspacePath: string, prompt: string): Promise<AiProviderRoutedResult> {
  const data = await getAiProviders(workspacePath);
  
  if (!data.enabled) {
    throw new Error('AI Provider is disabled');
  }

  const candidates = buildCandidateProviders(data.providers, data.activeProviderId, data.routingMode);
  if (candidates.length === 0) {
    throw new Error('No usable AI providers configured. Enable at least one provider with Base URL and Model.');
  }

  const attempts: AiProviderAttemptTrace[] = [];

  for (const provider of candidates) {
    try {
      const result = await generateWithProvider(workspacePath, provider, prompt);
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        providerType: provider.type,
        model: provider.model,
        ok: true,
      });

      return {
        result,
        providerId: provider.id,
        providerName: provider.name,
        providerType: provider.type,
        model: provider.model,
        attempts,
      };
    } catch (error: any) {
      attempts.push({
        providerId: provider.id,
        providerName: provider.name,
        providerType: provider.type,
        model: provider.model,
        ok: false,
        error: error?.message || String(error),
      });
    }
  }

  const summary = attempts.map(attempt => `${attempt.providerName}: ${attempt.error || 'failed'}`).join(' | ');
  throw new Error(`All configured AI providers failed. ${summary}`);
}

export async function generateJson(workspacePath: string, prompt: string): Promise<any> {
  const routed = await generateJsonWithTrace(workspacePath, prompt);
  return routed.result;
}

export async function fetchModels(workspacePath: string, provider: AiProvider): Promise<string[]> {
  let apiKey: string | undefined;
  if (provider.apiKeyRef) {
    apiKey = await getProviderApiKey(workspacePath, provider.apiKeyRef);
  }

  if (provider.type === 'ollama') {
    return fetchOllamaModels(provider.baseUrl);
  } else if (provider.type === 'openai-compatible') {
    return fetchOpenAiModels(provider.baseUrl, apiKey);
  }
  
  throw new Error(`Unsupported provider type: ${provider.type}`);
}

export async function testConnection(workspacePath: string, provider: AiProvider): Promise<string> {
  let apiKey: string | undefined;
  if (provider.apiKeyRef) {
    apiKey = await getProviderApiKey(workspacePath, provider.apiKeyRef);
  }

  if (provider.type === 'ollama') {
    return testOllamaConnection(provider.baseUrl, provider.model);
  } else if (provider.type === 'openai-compatible') {
    return testOpenAiConnection(provider.baseUrl, provider.model, apiKey);
  }

  return 'ชนิด Provider ไม่รองรับการเชื่อมต่อ';
}
