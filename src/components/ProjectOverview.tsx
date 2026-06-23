import { useState, useEffect, useMemo } from 'react';
import { ProjectDocument, scanProjectDocuments } from '../lib/document-scanner';
import { FileEntry } from '../lib/tauri-commands';
import {
  RefreshCw, FileText, Search, Lock, CheckCircle, FileWarning, Briefcase
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
  // const lockedDocs = documents.filter(d => d.locked).length;
  const openCRs = documents.filter(d => (d.folder === 'change-requests' || d.type === 'cr' || d.type === 'dcr') && d.status !== 'approved' && d.status !== 'rejected').length;
  const openSUPs = documents.filter(d => (d.folder === 'support-requests' || d.type === 'sup' || d.type === 'ma') && d.status !== 'approved' && d.status !== 'rejected').length;
  const pendingApprovals = documents.filter(d => d.folder === 'approvals' && d.status === 'pending').length;
  // const latestExport = documents.filter(d => d.type === 'export').sort((a, b) => (b.file_name.localeCompare(a.file_name)))[0];

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
      <div className="flex-none px-8 py-6 border-b border-white/5 bg-surface/50 backdrop-blur-md flex items-center justify-between z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-muted flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-primary" />
            {projectName}
          </h1>
          <p className="text-sm text-text-muted mt-1.5 font-medium">ภาพรวมโครงการและดัชนีเอกสาร (Project Overview)</p>
        </div>
        <button
          onClick={loadDocuments}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-sm font-medium hover:bg-white/10 transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรชข้อมูล
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard icon={<FileText className="w-5 h-5 text-accent" />} label="เอกสารทั้งหมด" value={totalDocs} />
          <SummaryCard icon={<CheckCircle className="w-5 h-5 text-success" />} label="อนุมัติแล้ว (Approved)" value={approvedDocs} />

          {/* Action Required Card */}
          <div className="bg-surface-2/50 backdrop-blur-sm border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-warning/5 hover:-translate-y-1">
            <span className="text-sm text-text-muted flex items-center gap-2 font-medium">
              <FileWarning className="w-4 h-4 text-warning" />
              ต้องดำเนินการ (Action Required)
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {openCRs > 0 && <span className="px-2.5 py-1 bg-warning/10 border border-warning/20 text-warning text-xs rounded-lg font-medium">{openCRs} CR</span>}
              {openSUPs > 0 && <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary-light text-xs rounded-lg font-medium">{openSUPs} SUP</span>}
              {pendingApprovals > 0 && <span className="px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent text-xs rounded-lg font-medium">{pendingApprovals} รออนุมัติ</span>}
              {draftDocs > 0 && <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-text-muted text-xs rounded-lg font-medium">{draftDocs} ฉบับร่าง</span>}
              {(openCRs === 0 && openSUPs === 0 && pendingApprovals === 0 && draftDocs === 0) && <span className="text-text-dim text-sm">-</span>}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors duration-300" />
            <input
              type="text"
              placeholder="ค้นหาจากชื่อเอกสาร, ประเภท, สถานะ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-surface-2/50 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-2xl text-sm focus:border-primary/50 focus:bg-surface-2 focus:ring-2 focus:ring-primary/20 transition-all duration-300 outline-none shadow-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full sm:w-48 px-4 py-2.5 bg-surface-2/50 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-2xl text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 outline-none appearance-none shadow-sm cursor-pointer"
          >
            <option value="all">ทุกประเภท (All Types)</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full sm:w-48 px-4 py-2.5 bg-surface-2/50 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-2xl text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 outline-none appearance-none shadow-sm cursor-pointer"
          >
            <option value="all">ทุกสถานะ (All Statuses)</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Document List */}
        <div className="bg-surface-2/30 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2/70 text-text-muted border-b border-white/5 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wide">ชื่อเอกสาร (Document)</th>
                  <th className="px-6 py-4 font-medium tracking-wide">ประเภท (Type)</th>
                  <th className="px-6 py-4 font-medium tracking-wide">สถานะ (Status)</th>
                  <th className="px-6 py-4 font-medium tracking-wide">เวอร์ชัน/เลขที่ (Ver/No)</th>
                  <th className="px-6 py-4 font-medium tracking-wide text-center">ล็อก (Locked)</th>
                  <th className="px-6 py-4 font-medium tracking-wide">อัปเดตเมื่อ (Updated)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
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
                      className="hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group"
                      onClick={() => onOpenDocument(doc.file_path)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-text-dim group-hover:text-primary transition-colors shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-text truncate" title={doc.title}>{doc.title}</div>
                            <div className="text-xs text-text-dim flex items-center gap-2 mt-0.5">
                              <span className="truncate">{doc.file_name}</span>
                              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase text-text-muted font-medium tracking-wider">
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
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs uppercase tracking-wider text-text-muted font-medium shadow-sm">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${doc.status === 'approved' ? 'bg-success/10 border-success/20 text-success' :
                            doc.status === 'pending' ? 'bg-warning/10 border-warning/20 text-warning' :
                              doc.status === 'rejected' ? 'bg-error/10 border-error/20 text-error' :
                                'bg-white/5 border-white/10 text-text-muted'
                          }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted font-mono text-xs">
                        {doc.document_number || `v${doc.version}`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {doc.locked ? (
                          <Lock className="w-4 h-4 text-error mx-auto opacity-80" />
                        ) : (
                          <span className="text-text-dim">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-muted text-xs">
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
    <div className="bg-surface-2/50 backdrop-blur-sm border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden group">
      {/* Decorative gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <span className="text-sm text-text-muted flex items-center gap-2 font-medium relative z-10">
        {icon}
        {label}
      </span>
      <span className="text-3xl font-bold text-text mt-4 relative z-10 drop-shadow-sm">{value}</span>
    </div>
  );
}
