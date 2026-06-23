import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCompanyProfile, saveCompanyProfile, getPresets, savePresets } from '../settings';
import * as tauriCommands from '../tauri-commands';
import YAML from 'yaml';

vi.mock('../tauri-commands', () => ({
  readFileContent: vi.fn(),
  writeFileContent: vi.fn(),
  pathExists: vi.fn(),
}));

describe('settings.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Company Profile', () => {
    it('should return null if profile does not exist', async () => {
      vi.mocked(tauriCommands.pathExists).mockResolvedValue(false);
      const profile = await getCompanyProfile('/test');
      expect(profile).toBeNull();
    });

    it('should parse existing profile', async () => {
      vi.mocked(tauriCommands.pathExists).mockResolvedValue(true);
      const yaml = `
provider_name: Test Company
provider_type: company
default_vat_percent: 7
`;
      vi.mocked(tauriCommands.readFileContent).mockResolvedValue(yaml);
      
      const profile = await getCompanyProfile('/test');
      expect(profile).toEqual({
        provider_name: 'Test Company',
        provider_type: 'company',
        default_vat_percent: 7,
      });
    });

    it('should throw MALFORMED_YAML if YAML is invalid', async () => {
      vi.mocked(tauriCommands.pathExists).mockResolvedValue(true);
      const yaml = `
invalid:
  -
    yaml: [
`;
      vi.mocked(tauriCommands.readFileContent).mockResolvedValue(yaml);
      
      await expect(getCompanyProfile('/test')).rejects.toThrow('MALFORMED_YAML');
    });

    it('should save profile to YAML', async () => {
      const profile = { provider_name: 'New Company', default_vat_percent: 7 };
      await saveCompanyProfile('/test', profile);
      
      expect(tauriCommands.writeFileContent).toHaveBeenCalledWith(
        '/test/.scopeflow/company-profile.yaml',
        YAML.stringify(profile)
      );
    });
  });

  describe('Presets', () => {
    it('should generate defaults if missing', async () => {
      vi.mocked(tauriCommands.pathExists).mockResolvedValue(false);
      
      const presets = await getPresets('/test');
      
      expect(presets.payment_terms.length).toBeGreaterThan(0);
      expect(tauriCommands.writeFileContent).toHaveBeenCalledTimes(1);
    });

    it('should merge defaults with parsed data', async () => {
      vi.mocked(tauriCommands.pathExists).mockResolvedValue(true);
      const yaml = `
payment_terms:
  - Custom term
`;
      vi.mocked(tauriCommands.readFileContent).mockResolvedValue(yaml);
      
      const presets = await getPresets('/test');
      expect(presets.payment_terms).toEqual(['Custom term']);
      expect(presets.out_of_scope.length).toBeGreaterThan(0); // Inherited from default
    });
  });
});
