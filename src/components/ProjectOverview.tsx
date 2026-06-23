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
    <div className="flex flex-col h-full bg-gradient-to-b from-[#121214] to-[#09090b] overflow-hidden">
      {/* Header */}
      <div className="flex-none px-8 py-6 border-b border-white/10 bg-white/[0.01] backdrop-blur-md flex items-center justify-between z-10 shadow-sm">
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

      <div className="flex-1 overflow-y-auto p-8 space-y-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard icon={<FileText className="w-5 h-5 text-accent" />} label="เอกสารทั้งหมด" value={totalDocs} />
          <SummaryCard icon={<CheckCircle className="w-5 h-5 text-success" />} label="อนุมัติแล้ว (Approved)" value={approvedDocs} />

          {/* Action Required Card */}
          <div className="bg-surface-2/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-warning/5 hover:-translate-y-1">
            <span className="text-sm text-text-muted flex items-center gap-2.5 font-semibold">
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
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-1 relative group">
            <Search className="w-4 h-4 absolute left-4.5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors duration-300" />
            <input
              type="text"
              placeholder="ค้นหาจากชื่อเอกสาร, ประเภท, สถานะ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-3 bg-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl text-sm text-text focus:border-primary/60 focus:bg-white/[0.04] focus:ring-2 focus:ring-primary/20 transition-all duration-300 outline-none shadow-sm"
            />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full sm:w-52 px-5 py-3 bg-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl text-sm text-text focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all duration-300 outline-none appearance-none shadow-sm cursor-pointer"
            >
              <option value="all" className="bg-surface-2 text-text">ทุกประเภท (All Types)</option>
              {uniqueTypes.map(t => <option key={t} value={t} className="bg-surface-2 text-text">{t}</option>)}
            </select>
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full sm:w-52 px-5 py-3 bg-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl text-sm text-text focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all duration-300 outline-none appearance-none shadow-sm cursor-pointer"
            >
              <option value="all" className="bg-surface-2 text-text">ทุกสถานะ (All Statuses)</option>
              {uniqueStatuses.map(s => <option key={s} value={s} className="bg-surface-2 text-text">{s}</option>)}
            </select>
          </div>
        </div>

        {/* Document List as Cards */}
        <div className="space-y-4 pb-8">
          {filteredDocs.length === 0 ? (
            <div className="bg-surface-2/30 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center shadow-lg shadow-black/20">
              <div className="flex flex-col items-center justify-center space-y-4">
                <FileText className="w-12 h-12 text-text-dim/50 animate-pulse" />
                <div>
                  <p className="text-text-muted font-semibold text-base">ยังไม่มีเอกสารในโครงการนี้ (No documents found)</p>
                  <p className="text-sm text-text-dim mt-2">คลิก + ที่ชื่อโครงการในแถบด้านซ้ายเพื่อสร้างเอกสารใหม่</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredDocs.map((doc, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenDocument(doc.file_path)}
                  className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-primary/40 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5 active:translate-y-0 relative overflow-hidden"
                >
                  {/* Hover Accent Glow */}
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Left Section: Icon and Document Identity */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-text-muted group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-300 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-text group-hover:text-primary-light transition-colors text-base truncate" title={doc.title}>
                        {doc.title}
                      </div>
                      <div className="text-xs text-text-dim flex flex-wrap items-center gap-2 mt-2">
                        <span className="font-mono text-text-muted font-medium">{doc.file_name}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] uppercase tracking-wider text-text-muted font-semibold">
                          {doc.folder}
                        </span>
                        {doc.parse_status === 'warning' && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-xs text-warning flex items-center gap-1 font-semibold">
                              <FileWarning className="w-3.5 h-3.5" /> YAML Frontmatter ไม่สมบูรณ์
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Badges & Info Columns */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-8 shrink-0 border-t border-white/5 lg:border-t-0 pt-4 lg:pt-0">
                    {/* Document Type Badge */}
                    <div className="flex flex-col gap-1 w-24">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">ประเภท</span>
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary-light uppercase tracking-wider text-center block w-fit">
                        {doc.type}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col gap-1 w-28">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">สถานะ</span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border text-center block w-fit uppercase tracking-wider ${
                        doc.status === 'approved' ? 'bg-success/10 border-success/20 text-success' :
                        doc.status === 'pending' ? 'bg-warning/10 border-warning/20 text-warning' :
                        doc.status === 'rejected' ? 'bg-error/10 border-error/20 text-error' :
                        'bg-white/5 border-white/10 text-text-muted'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    {/* Version */}
                    <div className="flex flex-col gap-1 w-24">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider font-sans">เวอร์ชัน/เลขที่</span>
                      <span className="text-xs font-mono bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded-lg text-text-muted font-bold text-center block w-fit">
                        {doc.document_number || `v${doc.version}`}
                      </span>
                    </div>

                    {/* Lock Status */}
                    <div className="flex flex-col items-center gap-1 w-16">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">ล็อก</span>
                      <div className="flex items-center justify-center h-7">
                        {doc.locked ? (
                          <div className="p-1 rounded bg-error/10 border border-error/20" title="ถูกล็อก">
                            <Lock className="w-3.5 h-3.5 text-error" />
                          </div>
                        ) : (
                          <span className="text-text-dim text-xs font-semibold">-</span>
                        )}
                      </div>
                    </div>

                    {/* Updated At */}
                    <div className="flex flex-col gap-1 w-24">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">อัปเดตเมื่อ</span>
                      <span className="text-xs text-text-muted font-semibold h-7 flex items-center">
                        {doc.updated || doc.created || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-surface-2/50 backdrop-blur-sm border border-white/5 p-6 rounded-2xl flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden group">
      {/* Decorative gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <span className="text-sm text-text-muted flex items-center gap-2.5 font-semibold relative z-10">
        {icon}
        {label}
      </span>
      <span className="text-3xl font-bold text-text mt-5 relative z-10 drop-shadow-sm">{value}</span>
    </div>
  );
}
