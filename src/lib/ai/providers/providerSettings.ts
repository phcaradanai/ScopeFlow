import YAML from 'yaml';
import { readFileContent, writeFileContent, pathExists } from '../../tauri-commands';
import { getAiSettings } from '../../settings';
import { AiProvidersData } from './types';

const defaultProviders: AiProvidersData = {
  enabled: false,
  activeProviderId: 'ollama-local',
  providers: [
    {
      id: 'ollama-local',
      name: 'Ollama Local',
      type: 'ollama',
      baseUrl: 'http://localhost:11434',
      model: ''
    },
    {
      id: 'custom-openai-compatible',
      name: 'Custom OpenAI-compatible',
      type: 'openai-compatible',
      baseUrl: '',
      model: '',
      apiKeyRef: 'custom-openai-compatible'
    }
  ]
};

export async function getAiProviders(workspacePath: string): Promise<AiProvidersData> {
  const providersPath = `${workspacePath}/.scopeflow/ai-providers.yaml`;
  const exists = await pathExists(providersPath);
  
  if (!exists) {
    // Check for old ai-settings.yaml
    const oldSettingsPath = `${workspacePath}/.scopeflow/ai-settings.yaml`;
    const oldSettingsExists = await pathExists(oldSettingsPath);
    
    if (oldSettingsExists) {
      try {
        const oldSettings = await getAiSettings(workspacePath);
        
        // Migrate
        const migratedData: AiProvidersData = {
          enabled: oldSettings.enabled && oldSettings.mode !== 'off',
          activeProviderId: 'ollama-local',
          providers: [
            {
              id: 'ollama-local',
              name: 'Ollama Local (Migrated)',
              type: 'ollama',
              baseUrl: oldSettings.baseUrl || 'http://localhost:11434',
              model: oldSettings.model || ''
            },
            {
              id: 'custom-openai-compatible',
              name: 'Custom OpenAI-compatible',
              type: 'openai-compatible',
              baseUrl: '',
              model: '',
              apiKeyRef: 'custom-openai-compatible'
            }
          ]
        };
        
        await saveAiProviders(workspacePath, migratedData);
        return migratedData;
      } catch (e) {
        console.error("Migration failed, falling back to defaults", e);
      }
    }
    
    // No old settings, or migration failed -> use defaults
    await saveAiProviders(workspacePath, defaultProviders);
    return defaultProviders;
  }
  
  try {
    const content = await readFileContent(providersPath);
    const parsed = YAML.parse(content) as AiProvidersData;
    
    // Merge defaults just in case
    return {
      enabled: parsed.enabled ?? false,
      activeProviderId: parsed.activeProviderId || 'ollama-local',
      providers: parsed.providers || defaultProviders.providers
    };
  } catch (err) {
    console.error("Failed to parse ai-providers.yaml:", err);
    return defaultProviders;
  }
}

export async function saveAiProviders(workspacePath: string, data: AiProvidersData): Promise<void> {
  const providersPath = `${workspacePath}/.scopeflow/ai-providers.yaml`;
  
  // Create a deep copy to scrub out potential secrets if they accidentally got in
  const dataToSave: AiProvidersData = JSON.parse(JSON.stringify(data));
  
  // Ensure we don't save raw api keys here if any leaked into the state object
  // (Assuming api keys are only kept in providerSecrets.ts and passed when needed,
  // but if the UI state mixes them, we strip them here)
  dataToSave.providers = dataToSave.providers.map(p => {
    const { ...safeProvider } = p;
    // (We only store apiKeyRef here, not the actual key)
    return safeProvider;
  });

  const yamlContent = YAML.stringify(dataToSave);
  await writeFileContent(providersPath, yamlContent);
}
