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
}

export interface AiProvidersData {
  enabled: boolean;
  activeProviderId: string;
  providers: AiProvider[];
}

export interface AiProviderSecrets {
  apiKeys: {
    [apiKeyRef: string]: string;
  };
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
