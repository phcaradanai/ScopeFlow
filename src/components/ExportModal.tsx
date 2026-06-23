import { useState, useEffect } from 'react';
import { X, Check, FileDown, FolderOpen, ExternalLink } from 'lucide-react';
import { DocumentInfo } from '../lib/tauri-commands';
import { exportApprovalPack } from '../lib/export';
import { open } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';

interface ExportModalProps {
  projectPath: string;
  projectName: string;
  clientName: string;
  documents: DocumentInfo[];
  onClose: () => void;
}

export default function ExportModal({
  projectPath,
  projectName,
  clientName,
  documents,
  onClose,
}: ExportModalProps) {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessPath, setExportSuccessPath] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Default selection: latest scope, quotation, acceptance checklist
  useEffect(() => {
    const defaults = new Set<string>();

    const getLatestDoc = (folder: string, prefix: string) => {
      const docsInFolder = documents.filter(d => d.folder === folder && d.filename.startsWith(prefix));
      if (docsInFolder.length > 0) {
        // Sort descending by filename to get latest (assuming versioning or numbering in filename)
        docsInFolder.sort((a, b) => b.filename.localeCompare(a.filename));
        return docsInFolder[0].path;
      }
      return null;
    };

    const latestScope = getLatestDoc('baseline', 'scope-');
    if (latestScope) defaults.add(latestScope);

    const latestQuotation = getLatestDoc('baseline', 'quotation-');
    if (latestQuotation) defaults.add(latestQuotation);

    const latestAcceptance = getLatestDoc('acceptance', 'acceptance-checklist-');
    if (latestAcceptance) defaults.add(latestAcceptance);

    setSelectedDocs(defaults);
  }, [documents]);

  const handleToggleDoc = (path: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleExport = async () => {
    if (selectedDocs.size === 0) {
      setError('กรุณาเลือกอย่างน้อย 1 เอกสาร');
      return;
    }

    try {
      setIsExporting(true);
      setError('');

      // Filter documents based on selection, preserve order from documents array
      const docsToExport = documents.filter(d => selectedDocs.has(d.path));
      
      const finalPath = await exportApprovalPack(projectPath, projectName, clientName, docsToExport);
      setExportSuccessPath(finalPath);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการส่งออกเอกสาร');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenFile = async () => {
    if (exportSuccessPath) {
      try {
        await open(exportSuccessPath);
      } catch (err) {
        console.error("Failed to open file:", err);
      }
    }
  };

  const handleRevealInFolder = async () => {
    if (exportSuccessPath) {
      try {
        // Tauri 2 `opener` plugin doesn't have a direct "reveal" method yet,
        // but we can try to open the folder containing it.
        // As a fallback, we invoke a custom rust command if we had one, but we don't.
        // So we just extract the directory path and open it.
        const dirPath = exportSuccessPath.substring(0, exportSuccessPath.lastIndexOf('/'));
        await open(dirPath);
      } catch (err) {
        console.error("Failed to reveal folder:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            ส่งออกชุดเอกสารขออนุมัติ
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-3 text-text-dim hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          {exportSuccessPath ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-2">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-text">ส่งออกสำเร็จ!</h3>
              <p className="text-sm text-text-muted break-all px-4">
                บันทึกไฟล์ไปที่:<br/>
                <span className="font-mono text-xs text-text">{exportSuccessPath}</span>
              </p>
              
              <div className="flex flex-col w-full max-w-xs gap-2 pt-4">
                <button
                  onClick={handleOpenFile}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  เปิดไฟล์ HTML
                </button>
                <button
                  onClick={handleRevealInFolder}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-surface hover:bg-surface-3 border border-border text-text rounded-lg transition-colors text-sm font-medium"
                >
                  <FolderOpen className="w-4 h-4" />
                  เปิดโฟลเดอร์ Exports
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-muted mb-4">
                เลือกเอกสารที่ต้องการรวมไว้ในชุดเอกสารขออนุมัติ ระบบจะสร้างไฟล์ HTML ที่พร้อมสำหรับสั่งพิมพ์ (Print) เป็น PDF
              </p>
              
              <div className="space-y-2 border border-border rounded-lg overflow-hidden bg-surface">
                {documents.length === 0 ? (
                  <div className="p-4 text-center text-sm text-text-dim">
                    ไม่มีเอกสารในโครงการนี้
                  </div>
                ) : (
                  documents.map((doc) => {
                    const isSelected = selectedDocs.has(doc.path);
                    return (
                      <label
                        key={doc.path}
                        className={\`flex items-start gap-3 p-3 hover:bg-surface-3 cursor-pointer transition-colors \${
                          isSelected ? 'bg-primary/5' : ''
                        }\`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleDoc(doc.path)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-surface bg-surface"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-text truncate" title={doc.filename}>
                            {doc.filename}
                          </div>
                          <div className="text-xs text-text-dim capitalize">
                            {doc.folder.replace('-', ' ')}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {!exportSuccessPath && (
          <div className="p-4 border-t border-border shrink-0 flex justify-end gap-2 bg-surface-2">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text hover:bg-surface-3 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || documents.length === 0}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isExporting ? (
                <>กำลังส่งออก...</>
              ) : (
                <>ส่งออก HTML</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
