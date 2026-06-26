import { FileText, Lock } from 'lucide-react';
import { ProjectDocument } from '../../lib/document-scanner';

interface DocumentListProps {
  filteredDocs: ProjectDocument[];
  onOpenDocument: (path: string) => void;
  clientId: string;
  projectPath: string;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, type: string) => void;
  onStartBriefIntake?: (clientId: string, projectId: string, projectPath: string) => void;
}

export default function DocumentList({
  filteredDocs,
  onOpenDocument,
  clientId,
  projectPath,
  onCreateDocument,
  onStartBriefIntake
}: DocumentListProps) {
  const projectId = projectPath.split('/').pop() || '';

  if (filteredDocs.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-14 h-14 text-text-dim/40 mb-5" />
        <p className="text-text-muted font-semibold text-lg">ยังไม่มีเอกสารในโปรเจกต์นี้</p>
        <p className="text-sm text-text-dim mt-2 max-w-sm mb-6">เริ่มจากคำขอลูกค้าเพื่อสร้าง Brief หรือสร้าง Scope โดยตรง</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              if (onStartBriefIntake) {
                onStartBriefIntake(clientId, projectId, projectPath);
              } else {
                onCreateDocument(clientId, projectId, projectPath, 'brief');
              }
            }}
            className="btn btn-ghost"
          >
            เริ่มจากคำขอลูกค้า
          </button>
          <button
            type="button"
            onClick={() => onCreateDocument(clientId, projectId, projectPath, 'scope')}
            className="btn btn-primary"
          >
            สร้าง Scope
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {filteredDocs.map((doc, idx) => (
        <button
          key={idx}
          onClick={() => onOpenDocument(doc.file_path)}
          className="card w-full text-left group flex flex-col hover:border-primary/50 hover:bg-surface-2/80 transition-all shadow-sm !p-5"
        >
          <div className="flex justify-between items-start mb-3 gap-2">
            <div className="font-semibold text-text group-hover:text-primary-light transition-colors text-base line-clamp-2 leading-relaxed">
              {doc.title}
            </div>
            {doc.locked && (
              <div className="p-1.5 rounded-md bg-error/10 border border-error/20 shrink-0" title="ถูกล็อก">
                <Lock className="w-3.5 h-3.5 text-error" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge badge-primary uppercase" style={{ fontSize: '0.65rem' }}>{doc.type}</span>
            <span className={`badge ${doc.status === 'approved' ? 'badge-success' : doc.status === 'pending' ? 'badge-warning' : doc.status === 'rejected' ? 'badge-error' : 'badge-muted'}`} style={{ fontSize: '0.65rem' }}>
              {doc.status}
            </span>
            <span className="badge badge-muted" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{doc.folder}</span>
          </div>

          <p className="text-xs text-text-muted line-clamp-3 leading-relaxed mb-4 flex-1">
            {doc.excerpt || "ไม่มีข้อมูลสรุป"}
          </p>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
            <span className="text-xs font-mono text-text-muted font-bold px-2 py-1 bg-surface-3 rounded-md">
              {doc.document_number || `v${doc.version}`}
            </span>
            <span className="text-xs text-text-dim whitespace-nowrap">
              {doc.updated || doc.created || '-'}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
