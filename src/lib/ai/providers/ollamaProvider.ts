import { AiProvider, OllamaPayload } from './types';

function cleanBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export async function fetchOllamaModels(baseUrl: string): Promise<string[]> {
  try {
    const apiUrl = `${cleanBaseUrl(baseUrl)}/api/tags`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data && Array.isArray(data.models)) {
      return data.models.map((m: any) => m.name);
    }
    return [];
  } catch (error: any) {
    throw new Error(error.message || 'ไม่สามารถดึงข้อมูลโมเดลจาก Ollama ได้');
  }
}

export async function testOllamaConnection(baseUrl: string, model: string): Promise<string> {
  try {
    // Test if we can reach the server and get tags
    const models = await fetchOllamaModels(baseUrl);
    
    if (model && !models.includes(model)) {
      return `ไม่พบ model นี้ (${model}) ใน Ollama server`;
    }
    
    return 'เชื่อมต่อสำเร็จ';
  } catch (err: any) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      return 'ไม่พบ provider ที่ URL นี้';
    }
    return err.message || 'การเชื่อมต่อล้มเหลว';
  }
}

export async function generateOllama(
  provider: AiProvider,
  prompt: string
): Promise<any> {
  const apiUrl = `${cleanBaseUrl(provider.baseUrl)}/api/generate`;
  
  const payload: OllamaPayload = {
    model: provider.model || 'llama3',
    prompt: prompt,
    stream: false,
    format: 'json',
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.response) {
    throw new Error('No response from Ollama API');
  }

  // Ollama response is a string containing JSON, so we parse it
  try {
    return JSON.parse(data.response);
  } catch (e) {
    throw new Error(`Failed to parse Ollama JSON response: ${e}`);
  }
}
