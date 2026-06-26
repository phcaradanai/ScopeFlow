export async function testOllamaConnection(baseUrl: string, model: string): Promise<string> {
  try {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const apiUrl = `${cleanBaseUrl}/api/generate`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'llama3',
        prompt: 'say "hi" in JSON format',
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
         // Usually 404 for model not found, sometimes 400
         const errData = await response.json().catch(() => null);
         if (errData && errData.error && errData.error.toLowerCase().includes('model')) {
            return "ไม่พบ model นี้";
         }
      }
      return `ไม่พบ Ollama ที่ ${baseUrl}`;
    }

    const data = await response.json();
    if (!data.response) {
      return "model ตอบกลับไม่เป็น JSON";
    }

    // Attempt to parse response to ensure it's valid JSON
    try {
      const cleanString = data.response.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      JSON.parse(cleanString);
      return "เชื่อมต่อ Ollama สำเร็จ";
    } catch {
      return "model ตอบกลับไม่เป็น JSON";
    }

  } catch (error) {
    console.error("Ollama connection test failed:", error);
    return `ไม่พบ Ollama ที่ ${baseUrl}`;
  }
}
