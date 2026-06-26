import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testOllamaConnection } from '../ollamaConnectionTest';

describe('testOllamaConnection', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('success with mocked response', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ response: '{"hi": "there"}' })
    });

    const status = await testOllamaConnection('http://localhost:11434', 'llama3');
    expect(status).toBe("เชื่อมต่อ Ollama สำเร็จ");
  });

  it('failure with mocked network error', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    const status = await testOllamaConnection('http://localhost:11434', 'llama3');
    expect(status).toBe("ไม่พบ Ollama ที่ http://localhost:11434");
  });

  it('failure when model not found', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'model not found' })
    });
    const status = await testOllamaConnection('http://localhost:11434', 'wrong-model');
    expect(status).toBe("ไม่พบ model นี้");
  });
});
