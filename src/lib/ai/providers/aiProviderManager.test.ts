import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAiProviders } from './providerSettings';
import { generateJsonWithTrace } from './aiProviderRouter';
import { generateOpenAi } from './openAiCompatibleProvider';
import { generateOllama } from './ollamaProvider';
import { AiProvider } from './types';
import * as tauriCommands from '../../tauri-commands';
import * as settings from '../../settings';
import * as providerSecrets from './providerSecrets';

// Mock dependencies
vi.mock('../../tauri-commands', () => ({
  pathExists: vi.fn(),
  readFileContent: vi.fn(),
  writeFileContent: vi.fn(),
}));

vi.mock('../../settings', () => ({
  getAiSettings: vi.fn(),
}));

vi.mock('./providerSecrets', () => ({
  getProviderApiKey: vi.fn(),
}));

// Mock fetch globally
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe('AI Provider Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Migration from old settings', () => {
    it('should migrate from ai-settings.yaml if ai-providers.yaml does not exist', async () => {
      // Setup mocks
      vi.mocked(tauriCommands.pathExists).mockImplementation(async (path: string) => {
        if (path.includes('ai-providers.yaml')) return false;
        if (path.includes('ai-settings.yaml')) return true;
        return false;
      });

      vi.mocked(settings.getAiSettings).mockResolvedValue({
        enabled: true,
        mode: 'ollama',
        baseUrl: 'http://custom-host:11434',
        model: 'custom-model'
      });

      const providersData = await getAiProviders('/mock/workspace');
      
      expect(providersData.enabled).toBe(true);
      expect(providersData.routingMode).toBe('priority-fallback');
      expect(providersData.providers[0].baseUrl).toBe('http://custom-host:11434');
      expect(providersData.providers[0].model).toBe('custom-model');
      expect(providersData.providers[0].enabled).toBe(true);
      expect(providersData.providers[0].priority).toBe(1);
      expect(tauriCommands.writeFileContent).toHaveBeenCalledWith(
        '/mock/workspace/.scopeflow/ai-providers.yaml',
        expect.any(String)
      );
    });

    it('should use default providers if neither exists', async () => {
      vi.mocked(tauriCommands.pathExists).mockResolvedValue(false);

      const providersData = await getAiProviders('/mock/workspace');
      
      expect(providersData.enabled).toBe(false);
      expect(providersData.routingMode).toBe('priority-fallback');
      expect(providersData.providers.length).toBe(2);
      expect(providersData.providers[0].type).toBe('ollama');
      expect(providersData.providers[1].type).toBe('openai-compatible');
    });
  });

  describe('Provider routing', () => {
    it('should try the active provider first and fall back to the next usable provider', async () => {
      vi.mocked(tauriCommands.pathExists).mockResolvedValue(true);
      vi.mocked(providerSecrets.getProviderApiKey).mockResolvedValue('fallback-key');
      vi.mocked(tauriCommands.readFileContent).mockResolvedValue(`
enabled: true
activeProviderId: primary
routingMode: priority-fallback
providers:
  - id: primary
    name: Primary Provider
    type: openai-compatible
    baseUrl: https://primary.test/v1
    model: primary-model
    apiKeyRef: primary
    enabled: true
    priority: 1
  - id: fallback
    name: Fallback Provider
    type: openai-compatible
    baseUrl: https://fallback.test/v1
    model: fallback-model
    apiKeyRef: fallback
    enabled: true
    priority: 2
`);

      globalFetch
        .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] })
        });

      const routed = await generateJsonWithTrace('/mock/workspace', 'Build JSON');

      expect(routed.result).toEqual({ ok: true });
      expect(routed.providerId).toBe('fallback');
      expect(routed.attempts).toEqual([
        expect.objectContaining({ providerId: 'primary', ok: false }),
        expect.objectContaining({ providerId: 'fallback', ok: true }),
      ]);
    });

    it('should respect active-only routing mode', async () => {
      vi.mocked(tauriCommands.pathExists).mockResolvedValue(true);
      vi.mocked(providerSecrets.getProviderApiKey).mockResolvedValue('key');
      vi.mocked(tauriCommands.readFileContent).mockResolvedValue(`
enabled: true
activeProviderId: primary
routingMode: active-only
providers:
  - id: primary
    name: Primary Provider
    type: openai-compatible
    baseUrl: https://primary.test/v1
    model: primary-model
    apiKeyRef: primary
    enabled: true
    priority: 1
  - id: fallback
    name: Fallback Provider
    type: openai-compatible
    baseUrl: https://fallback.test/v1
    model: fallback-model
    apiKeyRef: fallback
    enabled: true
    priority: 2
`);

      globalFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' });

      await expect(generateJsonWithTrace('/mock/workspace', 'Build JSON')).rejects.toThrow('All configured AI providers failed');
      expect(globalFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('OpenAI-compatible Provider', () => {
    it('should send correct payload and parse JSON response', async () => {
      const provider: AiProvider = {
        id: 'test',
        name: 'test',
        type: 'openai-compatible',
        baseUrl: 'https://api.test.com/v1',
        model: 'test-model'
      };

      const mockResponse = {
        choices: [
          { message: { content: '{"status": "success", "result": 123}' } }
        ]
      };

      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await generateOpenAi(provider, 'Hello', 'test-api-key');

      // Verify fetch arguments
      expect(globalFetch).toHaveBeenCalledWith('https://api.test.com/v1/chat/completions', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key'
        }),
        body: expect.stringContaining('"model":"test-model"')
      }));

      // Verify result parsing
      expect(result).toEqual({ status: 'success', result: 123 });
    });

    it('should throw error if API fails', async () => {
      const provider: AiProvider = {
        id: 'test',
        name: 'test',
        type: 'openai-compatible',
        baseUrl: 'https://api.test.com/v1',
        model: 'test-model'
      };

      globalFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(generateOpenAi(provider, 'Hello', 'wrong-key')).rejects.toThrow('OpenAI-compatible API error: 401 Unauthorized');
    });
  });

  describe('Ollama Provider', () => {
    it('should parse embedded JSON from Ollama response', async () => {
      const provider: AiProvider = {
        id: 'test',
        name: 'test',
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        model: 'llama3'
      };

      const mockResponse = {
        response: '{"key": "value"}'
      };

      globalFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await generateOllama(provider, 'Hello');

      expect(globalFetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"prompt":"Hello"')
      }));

      expect(result).toEqual({ key: 'value' });
    });
  });
});
