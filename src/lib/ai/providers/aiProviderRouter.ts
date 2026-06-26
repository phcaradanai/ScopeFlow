import { getAiProviders } from './providerSettings';
import { getProviderApiKey } from './providerSecrets';
import { generateOllama, testOllamaConnection, fetchOllamaModels } from './ollamaProvider';
import { generateOpenAi, testOpenAiConnection, fetchOpenAiModels } from './openAiCompatibleProvider';
import { AiProvider } from './types';

export async function generateJson(workspacePath: string, prompt: string): Promise<any> {
  const data = await getAiProviders(workspacePath);
  
  if (!data.enabled) {
    throw new Error('AI Provider is disabled');
  }

  const activeProvider = data.providers.find(p => p.id === data.activeProviderId);
  if (!activeProvider) {
    throw new Error(`Active provider (${data.activeProviderId}) not found`);
  }

  let apiKey: string | undefined;
  if (activeProvider.apiKeyRef) {
    apiKey = await getProviderApiKey(workspacePath, activeProvider.apiKeyRef);
  }

  if (activeProvider.type === 'ollama') {
    return generateOllama(activeProvider, prompt);
  } else if (activeProvider.type === 'openai-compatible') {
    return generateOpenAi(activeProvider, prompt, apiKey);
  } else {
    throw new Error(`Unsupported provider type: ${activeProvider.type}`);
  }
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
