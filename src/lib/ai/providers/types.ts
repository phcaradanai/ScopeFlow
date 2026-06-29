export type ProviderType = 'ollama' | 'openai-compatible';

export interface AiProvider {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  model: string;
  modelList?: string[];
  lastModelRefreshAt?: string;
  apiKeyRef?: string;
  enabled?: boolean;
  priority?: number;
}

export type AiProviderRoutingMode = 'active-only' | 'priority-fallback';

export interface AiProvidersData {
  enabled: boolean;
  activeProviderId: string;
  routingMode?: AiProviderRoutingMode;
  providers: AiProvider[];
}

export interface AiProviderSecrets {
  apiKeys: {
    [apiKeyRef: string]: string;
  };
}

export interface AiProviderAttemptTrace {
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  model: string;
  ok: boolean;
  error?: string;
}

export interface AiProviderRoutedResult<T = any> {
  result: T;
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  model: string;
  attempts: AiProviderAttemptTrace[];
}

// Generate payload for OpenRouter/OpenAI-compatible APIs
export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAiPayload {
  model: string;
  messages: OpenAiMessage[];
  temperature?: number;
  response_format?: { type: 'json_object' };
}

// Generate payload for Ollama APIs
export interface OllamaPayload {
  model: string;
  prompt: string;
  stream: boolean;
  format?: string;
}
