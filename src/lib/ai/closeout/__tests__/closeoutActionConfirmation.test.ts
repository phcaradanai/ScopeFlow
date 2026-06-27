import { describe, expect, it } from 'vitest';
import { buildCloseoutExportConfirmationMessage, buildCloseoutPackConfirmationMessage } from '../closeoutActionConfirmation';

const projectName = 'CRM Revamp';
const projectPath = '/workspace/clients/acme/projects/crm-revamp';

describe('closeoutActionConfirmation', () => {
  it('builds a closeout pack confirmation message with relative paths', () => {
    const message = buildCloseoutPackConfirmationMessage(projectName, projectPath, [
      { path: `${projectPath}/closeout/closeout-summary.md` },
      { path: `${projectPath}/closeout/delivery-evidence.md` },
      { path: `${projectPath}/closeout/acceptance-reference.md` },
      { path: `${projectPath}/closeout/scope-and-change-baseline-index.md` },
    ]);

    expect(message).toContain('กำลังจะสร้าง Closeout Pack');
    expect(message).toContain(projectName);
    expect(message).toContain('- closeout/closeout-summary.md');
    expect(message).toContain('- closeout/delivery-evidence.md');
    expect(message).toContain('ยืนยันหรือไม่?');
  });

  it('builds an export index confirmation message with a relative path', () => {
    const message = buildCloseoutExportConfirmationMessage(projectName, projectPath, `${projectPath}/exports/closeout-package-index.md`);

    expect(message).toContain('กำลังจะสร้าง Closeout Export Index');
    expect(message).toContain(projectName);
    expect(message).toContain('- exports/closeout-package-index.md');
    expect(message).toContain('ยืนยันหรือไม่?');
  });

  it('keeps external paths intact when they are not under the project path', () => {
    const message = buildCloseoutExportConfirmationMessage(projectName, projectPath, '/tmp/closeout-package-index.md');

    expect(message).toContain('- /tmp/closeout-package-index.md');
  });
});
