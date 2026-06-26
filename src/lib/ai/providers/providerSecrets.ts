import YAML from 'yaml';
import { readFileContent, writeFileContent, pathExists } from '../../tauri-commands';
import { AiProviderSecrets } from './types';

export async function getAiProviderSecrets(workspacePath: string): Promise<AiProviderSecrets> {
  const secretsPath = `${workspacePath}/.scopeflow/secrets.local.yaml`;
  const exists = await pathExists(secretsPath);
  
  if (!exists) {
    return { apiKeys: {} };
  }
  
  try {
    const content = await readFileContent(secretsPath);
    const parsed = YAML.parse(content) as AiProviderSecrets;
    
    return {
      apiKeys: parsed?.apiKeys || {}
    };
  } catch (err) {
    console.error("Failed to parse secrets.local.yaml:", err);
    return { apiKeys: {} };
  }
}

export async function saveAiProviderSecrets(workspacePath: string, secrets: AiProviderSecrets): Promise<void> {
  const secretsPath = `${workspacePath}/.scopeflow/secrets.local.yaml`;
  const yamlContent = YAML.stringify(secrets);
  await writeFileContent(secretsPath, yamlContent);
}

export async function setProviderApiKey(workspacePath: string, apiKeyRef: string, apiKey: string): Promise<void> {
  const secrets = await getAiProviderSecrets(workspacePath);
  secrets.apiKeys[apiKeyRef] = apiKey;
  await saveAiProviderSecrets(workspacePath, secrets);
}

export async function getProviderApiKey(workspacePath: string, apiKeyRef: string): Promise<string | undefined> {
  const secrets = await getAiProviderSecrets(workspacePath);
  return secrets.apiKeys[apiKeyRef];
}
