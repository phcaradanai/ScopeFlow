import { AiProvider, OpenAiPayload } from './types';

function cleanBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export async function fetchOpenAiModels(baseUrl: string, apiKey?: string): Promise<string[]> {
  try {
    const apiUrl = `${cleanBaseUrl(baseUrl)}/models`;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('API key ไม่ถูกต้องหรือไม่มีสิทธิ์');
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data && Array.isArray(data.data)) {
      return data.data.map((m: any) => m.id);
    }
    return [];
  } catch (error: any) {
    if (error.message.includes('API key')) throw error;
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('ไม่พบ provider ที่ URL นี้');
    }
    throw new Error(error.message || 'ไม่สามารถดึงข้อมูลโมเดลได้');
  }
}

export async function testOpenAiConnection(baseUrl: string, model: string, apiKey?: string): Promise<string> {
  try {
    const models = await fetchOpenAiModels(baseUrl, apiKey);
    
    if (model && !models.includes(model)) {
      return `ไม่พบ model นี้ (${model})`;
    }
    
    return 'เชื่อมต่อสำเร็จ';
  } catch (err: any) {
    return err.message || 'การเชื่อมต่อล้มเหลว';
  }
}

export async function generateOpenAi(
  provider: AiProvider,
  prompt: string,
  apiKey?: string
): Promise<any> {
  const apiUrl = `${cleanBaseUrl(provider.baseUrl)}/chat/completions`;
  
  const payload: OpenAiPayload = {
    model: provider.model || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a Thai scope analyst. Return strict JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No choices returned from API');
  }

  const content = data.choices[0].message?.content;
  if (!content) {
    throw new Error('No content returned from API');
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse JSON response: ${e}`);
  }
}
