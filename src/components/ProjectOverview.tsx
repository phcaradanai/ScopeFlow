import { useState, useEffect, useMemo } from 'react';
import { ProjectDocument, scanProjectDocuments } from '../lib/document-scanner';
import { FileEntry } from '../lib/tauri-commands';
import {
  RefreshCw, FileText, Search, Lock, CheckCircle, Clock, FileWarning, Briefcase, FileCode
} from 'lucide-react';

interface ProjectOverviewProps {
  projectPath: string;
  projectName: string;
  workspaceTree: FileEntry;
  onOpenDocument: (path: string) => void;
}

export default function ProjectOverview({ projectPath, projectName, workspaceTree, onOpenDocument }: ProjectOverviewProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await scanProjectDocuments(projectPath, workspaceTree);
      // Sort by updated descending, then created descending
      docs.sort((a, b) => {
        const dateA = a.updated || a.created || '';
        const dateB = b.updated || b.created || '';
        if (dateA && dateB) return dateB.localeCompare(dateA);
        return 0;
      });
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [projectPath, workspaceTree]);

  // Derived Summary Counts
  const totalDocs = documents.length;
  const draftDocs = documents.filter(d => d.status === 'draft').length;
  const approvedDocs = documents.filter(d => d.status === 'approved').length;
  const lockedDocs = documents.filter(d => d.locked).length;
  const openCRs = documents.filter(d => (d.folder === 'change-requests' || d.type === 'cr' || d.type === 'dcr') && d.status !== 'approved' && d.status !== 'rejected').length;
  const openSUPs = documents.filter(d => (d.folder === 'support-requests' || d.type === 'sup' || d.type === 'ma') && d.status !== 'approved' && d.status !== 'rejected').length;
  const pendingApprovals = documents.filter(d => d.folder === 'approvals' && d.status === 'pending').length;
  const latestExport = documents.filter(d => d.type === 'export').sort((a, b) => (b.file_name.localeCompare(a.file_name)))[0];

  // Filtering and Searching
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // Filter by Type
      if (filterType !== 'all' && doc.type !== filterType && doc.folder !== filterType) return false;
      
      // Filter by Status
      if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
      
      // Filter by Search Query (title, filename, type, excerpt, status)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          doc.title.toLowerCase().includes(query) ||
          doc.file_name.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query) ||
          doc.status.toLowerCase().includes(query) ||
          doc.excerpt.toLowerCase().includes(query);
        if (!matches) return false;
      }
      
      return true;
    });
  }, [documents, searchQuery, filterType, filterStatus]);

  const uniqueTypes = Array.from(new Set(documents.map(d => d.type))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(documents.map(d => d.status))).filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-border bg-surface-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-primary" />
            {projectName}
          </h1>
          <p className="text-sm text-text-muted mt-1">ภาพรวมโครงการและดัชนีเอกสาร (Project Overview & Index)</p>
        </div>
        <button
          onClick={loadDocuments}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-3 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรชดัชนีเอกสาร
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard icon={<FileText className="w-5 h-5 text-accent" />} label="เอกสารทั้งหมด" value={totalDocs} />
          <SummaryCard icon={<Clock className="w-5 h-5 text-warning" />} label="ฉบับร่าง (Draft)" value={draftDocs} />
          <SummaryCard icon={<CheckCircle className="w-5 h-5 text-success" />} label="อนุมัติแล้ว (Approved)" value={approvedDocs} />
          <SummaryCard icon={<Lock className="w-5 h-5 text-error" />} label="ล็อก (Locked)" value={lockedDocs} />
          <SummaryCard icon={<FileWarning className="w-5 h-5 text-warning" />} label="CR/DCR รอดำเนินการ" value={openCRs} />
          <SummaryCard icon={<FileCode className="w-5 h-5 text-primary-light" />} label="SUP/MA รอดำเนินการ" value={openSUPs} />
          <SummaryCard icon={<CheckCircle className="w-5 h-5 text-primary" />} label="รออนุมัติ (Pending Approval)" value={pendingApprovals} />
          <div className="bg-surface-2 border border-border p-4 rounded-xl flex flex-col justify-between">
            <span className="text-sm text-text-muted">ไฟล์ Export ล่าสุด</span>
            <span className="text-lg font-semibold text-text truncate mt-1" title={latestExport?.file_name || '-'}>
              {latestExport ? latestExport.file_name : '-'}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 bg-surface-2 p-4 rounded-xl border border-border">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="ค้นหาจากชื่อเอกสาร, ประเภท, สถานะ หรือเนื้อหา..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:border-primary transition-colors"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:border-primary"
          >
            <option value="all">ทุกประเภท (All Types)</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:border-primary"
          >
            <option value="all">ทุกสถานะ (All Statuses)</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Document List */}
        <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-3 text-text-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">ชื่อเอกสาร (Document)</th>
                  <th className="px-4 py-3 font-medium">ประเภท (Type)</th>
                  <th className="px-4 py-3 font-medium">สถานะ (Status)</th>
                  <th className="px-4 py-3 font-medium">เวอร์ชัน/เลขที่ (Ver/No)</th>
                  <th className="px-4 py-3 font-medium text-center">ล็อก (Locked)</th>
                  <th className="px-4 py-3 font-medium">อัปเดตเมื่อ (Updated)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <FileText className="w-10 h-10 text-text-dim/50" />
                        <div>
                          <p className="text-text-muted font-medium">ยังไม่มีเอกสารในโครงการนี้ (No documents found)</p>
                          <p className="text-sm text-text-dim mt-1">คลิก + ที่ชื่อโครงการในแถบด้านซ้ายเพื่อสร้างเอกสารใหม่</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-surface-3/50 transition-colors cursor-pointer group"
                      onClick={() => onOpenDocument(doc.file_path)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-text-dim group-hover:text-primary transition-colors shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-text truncate" title={doc.title}>{doc.title}</div>
                            <div className="text-xs text-text-dim flex items-center gap-2 mt-0.5">
                              <span className="truncate">{doc.file_name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] uppercase text-text-muted">
                                {doc.folder}
                              </span>
                            </div>
                            {doc.parse_status === 'warning' && (
                              <div className="text-xs text-warning mt-1 flex items-center gap-1">
                                <FileWarning className="w-3 h-3" /> YAML Frontmatter ไม่สมบูรณ์
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-surface border border-border text-xs uppercase tracking-wider text-text-muted">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'approved' ? 'bg-success/10 text-success' :
                          doc.status === 'pending' ? 'bg-warning/10 text-warning' :
                          doc.status === 'rejected' ? 'bg-error/10 text-error' :
                          'bg-surface border border-border text-text-muted'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted font-mono text-xs">
                        {doc.document_number || `v${doc.version}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc.locked ? (
                          <Lock className="w-4 h-4 text-error mx-auto" />
                        ) : (
                          <span className="text-text-dim">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs">
                        {doc.updated || doc.created || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-surface-2 border border-border p-4 rounded-xl flex flex-col justify-between">
      <span className="text-sm text-text-muted flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-2xl font-bold text-text mt-2">{value}</span>
    </div>
  );
}
