import { useState } from 'react';
import { X } from 'lucide-react';
import DiscoveryWorkspaceContainer from './DiscoveryWorkspaceContainer';
import { createDiscoveryBriefFile } from '../../lib/ai/brief-assistant/discoveryBriefFile';
import { createDiscoveryScopeFile } from '../../lib/ai/brief-assistant/discoveryScopeFile';
import { createDiscoveryQuotationFile } from '../../lib/ai/brief-assistant/discoveryQuotationFile';
import type { DiscoverySession } from '../../lib/ai/brief-assistant/discoverySession';
import { createProject } from '../../lib/tauri-commands';
import { generateProjectYaml } from '../../lib/templates';

interface DiscoveryStartModalProps {
  clientId: string;
  workspacePath?: string;
  projectId?: string;
  projectPath?: string;
  onClose: () => void;
  onBriefCreated?: (path: string) => void | Promise<void>;
  onScopeCreated?: (path: string) => void | Promise<void>;
  onQuotationCreated?: (path: string) => void | Promise<void>;
  onCreateBriefDraft?: (session: DiscoverySession) => void | Promise<void>;
}

interface ProjectTarget {
  projectId: string;
  projectPath: string;
}

function createGeneratedProjectId() {
  return `discovery-${Date.now()}`;
}

function createGeneratedProjectName(session: DiscoverySession) {
  return `Discovery Brief (${session.projectType || 'Requirement'})`;
}

export default function DiscoveryStartModal({ clientId, workspacePath, projectId, projectPath, onClose, onBriefCreated, onScopeCreated, onQuotationCreated, onCreateBriefDraft }: DiscoveryStartModalProps) {
  const [rawRequest, setRawRequest] = useState('');
  const [started, setStarted] = useState(false);
  const [notice, setNotice] = useState('');
  const [savingBrief, setSavingBrief] = useState(false);
  const [savingScope, setSavingScope] = useState(false);
  const [savingQuotation, setSavingQuotation] = useState(false);

  const canStart = rawRequest.trim().length > 0;

  const resolveProjectTarget = async (session: DiscoverySession): Promise<ProjectTarget | null> => {
    if (projectId && projectPath) return { projectId, projectPath };

    if (!workspacePath) {
      setNotice('Brief ready. Create or open a project first, then run Start Discovery from that project to write Brief.md.');
      return null;
    }

    const nextProjectId = createGeneratedProjectId();
    const nextProjectPath = `${workspacePath}/clients/${clientId}/projects/${nextProjectId}`;
    const projectYaml = generateProjectYaml({
      id: nextProjectId,
      name: createGeneratedProjectName(session),
      client: clientId,
      type: 'new-project',
      notes: 'Created from Start Discovery after customer request was ready for a brief.',
    });

    await createProject(workspacePath, clientId, nextProjectId, projectYaml, 'new-project');
    return { projectId: nextProjectId, projectPath: nextProjectPath };
  };

  const handleGenerateBrief = async (session: DiscoverySession) => {
    if (onCreateBriefDraft) {
      await onCreateBriefDraft(session);
      onClose();
      return;
    }

    try {
      setSavingBrief(true);
      setNotice('');
      const target = await resolveProjectTarget(session);
      if (!target) return;
      const result = await createDiscoveryBriefFile({
        session,
        clientId,
        projectId: target.projectId,
        projectPath: target.projectPath,
      });
      setNotice(`สร้าง Brief Draft แล้ว: ${result.path}`);
      await onBriefCreated?.(result.path);
      onClose();
    } catch (error) {
      setNotice(`สร้าง Brief Draft ไม่สำเร็จ: ${error}`);
    } finally {
      setSavingBrief(false);
    }
  };

  const handleGenerateScope = async (session: DiscoverySession) => {
    if (!projectId || !projectPath) {
      setNotice('Scope ready. Create or open a project first, then run Start Discovery from that project to write Scope.md.');
      return;
    }

    try {
      setSavingScope(true);
      setNotice('');
      const result = await createDiscoveryScopeFile({
        session,
        projectId,
        projectPath,
      });
      setNotice(`สร้าง Scope Draft แล้ว: ${result.path}`);
      await onScopeCreated?.(result.path);
      onClose();
    } catch (error) {
      setNotice(`สร้าง Scope Draft ไม่สำเร็จ: ${error}`);
    } finally {
      setSavingScope(false);
    }
  };

  const handleGenerateQuotation = async (session: DiscoverySession) => {
    if (!projectId || !projectPath) {
      setNotice('Quotation ready. Create or open a project first, then run Start Discovery from that project to write Quotation.md.');
      return;
    }

    try {
      setSavingQuotation(true);
      setNotice('');
      const result = await createDiscoveryQuotationFile({
        session,
        clientId,
        projectId,
        projectPath,
      });
      setNotice(`สร้าง Quotation Draft แล้ว: ${result.path}`);
      await onQuotationCreated?.(result.path);
      onClose();
    } catch (error) {
      setNotice(`สร้าง Quotation Draft ไม่สำเร็จ: ${error}`);
    } finally {
      setSavingQuotation(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container !max-w-6xl h-[calc(100dvh-48px)]">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">Start Discovery</h2>
            <p className="modal-subtitle">เริ่มจากคำขอลูกค้า แล้วให้ ScopeFlow ถามต่อจนข้อมูลพร้อมก่อนสร้างเอกสาร</p>
          </div>
          <button type="button" onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body space-y-5 min-h-0">
          {!started ? (
            <div className="rounded-2xl border border-border bg-surface-2/60 p-4 space-y-4">
              <div>
                <label className="form-label mb-2 block">คำขอลูกค้า / แชท / อีเมล / note ประชุม</label>
                <textarea
                  value={rawRequest}
                  onChange={(event) => setRawRequest(event.target.value)}
                  rows={8}
                  className="form-textarea"
                  placeholder="วางข้อความจากลูกค้าที่นี่ เช่น อยากทำระบบขายของออนไลน์..."
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="btn btn-ghost">ยกเลิก</button>
                <button type="button" onClick={() => setStarted(true)} disabled={!canStart} className="btn btn-primary">
                  Start Discovery
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-[640px] lg:min-h-0 lg:flex-1">
              <DiscoveryWorkspaceContainer
                clientId={clientId}
                projectId={projectId}
                rawRequest={rawRequest}
                onGenerateBrief={handleGenerateBrief}
                onGenerateScope={handleGenerateScope}
                onGenerateQuotation={handleGenerateQuotation}
              />
            </div>
          )}

          {savingBrief && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              กำลังสร้าง Brief file จาก Discovery Session...
            </div>
          )}

          {savingScope && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              กำลังสร้าง Scope file จาก Discovery Session...
            </div>
          )}

          {savingQuotation && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              กำลังสร้าง Quotation file จาก Discovery Session...
            </div>
          )}

          {notice && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary break-all">
              {notice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
