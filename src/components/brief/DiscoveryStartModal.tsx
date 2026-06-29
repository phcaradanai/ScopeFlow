import { useState } from 'react';
import { X } from 'lucide-react';
import DiscoveryWorkspaceContainer from './DiscoveryWorkspaceContainer';
import type { DiscoverySession } from '../../lib/ai/brief-assistant/discoverySession';

interface DiscoveryStartModalProps {
  clientId: string;
  projectId?: string;
  onClose: () => void;
  onCreateBriefDraft?: (session: DiscoverySession) => void;
}

export default function DiscoveryStartModal({ clientId, projectId, onClose, onCreateBriefDraft }: DiscoveryStartModalProps) {
  const [rawRequest, setRawRequest] = useState('');
  const [started, setStarted] = useState(false);
  const [notice, setNotice] = useState('');

  const canStart = rawRequest.trim().length > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-container !max-w-6xl">
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">Start Discovery</h2>
            <p className="modal-subtitle">เริ่มจากคำขอลูกค้า แล้วให้ ScopeFlow ถามต่อจนข้อมูลพร้อมก่อนสร้างเอกสาร</p>
          </div>
          <button type="button" onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body space-y-5">
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
            <DiscoveryWorkspaceContainer
              clientId={clientId}
              projectId={projectId}
              rawRequest={rawRequest}
              onGenerateBrief={(session) => {
                if (onCreateBriefDraft) {
                  onCreateBriefDraft(session);
                  return;
                }
                setNotice('Brief readiness reached. Open Preview Brief + Scope to generate documents.');
              }}
              onGenerateScope={() => setNotice('Scope readiness reached. Next integration will generate Scope from this session.')}
              onGenerateQuotation={() => setNotice('Quotation readiness reached. Next integration will generate Quotation from this session.')}
            />
          )}

          {notice && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              {notice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
