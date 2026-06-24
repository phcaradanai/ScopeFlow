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
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-muted flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-primary" />
            {projectName}
          </h1>
          <p className="text-base text-text-muted mt-2 font-medium">ภาพรวมโครงการและดัชนีเอกสาร</p>
        </div>
        <button
          onClick={loadDocuments}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-base font-medium hover:bg-white/10 transition-all duration-300 disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 min-h-[44px]"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรชข้อมูล
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-section-lg">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard icon={<FileText className="w-5 h-5 text-accent" />} label="เอกสารทั้งหมด" value={totalDocs} />
          <SummaryCard icon={<CheckCircle className="w-5 h-5 text-success" />} label="อนุมัติแล้ว" value={approvedDocs} />

          {/* Action Required Card */}
          <div className="card card-hover flex flex-col justify-between min-h-[140px]">
            <span className="text-sm text-text-muted flex items-center gap-2.5 font-semibold">
              <FileWarning className="w-4 h-4 text-warning" />
              ต้องดำเนินการ
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {openCRs > 0 && <span className="badge badge-warning">{openCRs} CR</span>}
              {openSUPs > 0 && <span className="badge badge-primary">{openSUPs} SUP</span>}
              {pendingApprovals > 0 && <span className="badge badge-accent">{pendingApprovals} รออนุมัติ</span>}
              {draftDocs > 0 && <span className="badge badge-muted">{draftDocs} ฉบับร่าง</span>}
              {(openCRs === 0 && openSUPs === 0 && pendingApprovals === 0 && draftDocs === 0) && <span className="text-text-dim text-sm font-medium">-</span>}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-1 relative group">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors duration-300" />
            <input
              type="text"
              placeholder="ค้นหาจากชื่อเอกสาร, ประเภท, สถานะ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input pl-12"
            />
          </div>
          <div className="relative sm:w-56">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="form-select"
            >
              <option value="all">ทุกประเภท</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="relative sm:w-56">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="form-select"
            >
              <option value="all">ทุกสถานะ</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Document List */}
        <div className="space-y-4 pb-8">
          {filteredDocs.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-14 h-14 text-text-dim/40 mb-5" />
              <p className="text-text-muted font-semibold text-lg">ยังไม่มีเอกสารในโครงการนี้</p>
              <p className="text-sm text-text-dim mt-2 max-w-sm">คลิก + ที่ชื่อโครงการในแถบด้านซ้ายเพื่อสร้างเอกสารใหม่</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredDocs.map((doc, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenDocument(doc.file_path)}
                  className="card card-hover w-full text-left p-5 lg:p-6 group"
                >
                  {/* Left Section: Icon and Document Identity */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-text-muted group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-300 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-text group-hover:text-primary-light transition-colors text-base truncate">
                        {doc.title}
                      </div>
                      <div className="text-sm text-text-dim flex flex-wrap items-center gap-3 mt-2">
                        <span className="font-mono text-text-muted font-medium">{doc.file_name}</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] uppercase tracking-wider text-text-muted font-semibold">
                          {doc.folder}
                        </span>
                        {doc.parse_status === 'warning' && (
                          <span className="text-xs text-warning flex items-center gap-1.5 font-semibold">
                            <FileWarning className="w-3.5 h-3.5" /> YAML ไม่สมบูรณ์
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Badges */}
                  <div className="flex flex-wrap items-center gap-3 lg:gap-5 shrink-0">
                    {/* Document Type Badge */}
                    <div className="hidden sm:flex flex-col items-center gap-1">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">ประเภท</span>
                      <span className="badge badge-primary uppercase">
                        {doc.type}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="hidden sm:flex flex-col items-center gap-1">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">สถานะ</span>
                      <span className={`badge ${doc.status === 'approved' ? 'badge-success' : doc.status === 'pending' ? 'badge-warning' : doc.status === 'rejected' ? 'badge-error' : 'badge-muted'}`}>
                        {doc.status}
                      </span>
                    </div>

                    {/* Version */}
                    <div className="hidden md:flex flex-col items-center gap-1">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">เลขที่</span>
                      <span className="text-xs font-mono bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded-lg text-text-muted font-bold">
                        {doc.document_number || `v${doc.version}`}
                      </span>
                    </div>

                    {/* Lock Status */}
                    <div className="hidden lg:flex flex-col items-center gap-1">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">ล็อก</span>
                      <div className="flex items-center justify-center h-7">
                        {doc.locked ? (
                          <div className="p-1.5 rounded-lg bg-error/10 border border-error/20" title="ถูกล็อก">
                            <Lock className="w-3.5 h-3.5 text-error" />
                          </div>
                        ) : (
                          <span className="text-text-dim text-xs font-medium">-</span>
                        )}
                      </div>
                    </div>

                    {/* Updated At */}
                    <div className="hidden lg:flex flex-col items-center gap-1">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">อัปเดต</span>
                      <span className="text-xs text-text-muted font-medium whitespace-nowrap">
                        {doc.updated || doc.created || '-'}
                      </span>
                    </div>
                  </div>
                </button>
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
    <div className="card card-hover flex flex-col justify-between min-h-[140px]">
      <span className="text-sm text-text-muted flex items-center gap-2.5 font-semibold">
        {icon}
        {label}
      </span>
      <span className="text-4xl font-bold text-text mt-4">{value}</span>
    </div>
  );
}
