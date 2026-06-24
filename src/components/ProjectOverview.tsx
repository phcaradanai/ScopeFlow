import { useState, useEffect, useMemo } from 'react';
import { ProjectDocument, scanProjectDocuments } from '../lib/document-scanner';
import { FileEntry } from '../lib/tauri-commands';
import {
  RefreshCw, FileText, Search, Lock, CheckCircle, Briefcase, ArrowRight, AlertTriangle, Target, Plus
} from 'lucide-react';

interface ProjectOverviewProps {
  projectPath: string;
  projectName: string;
  workspaceTree: FileEntry;
  onOpenDocument: (path: string) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string) => void;
}

export default function ProjectOverview({ projectPath, projectName, workspaceTree, onOpenDocument, onCreateDocument }: ProjectOverviewProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await scanProjectDocuments(projectPath, workspaceTree);
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

  // Extract clientId from path
  const clientId = projectPath.split('/').slice(-2, -1)[0] || '';

  // Derived Summary Counts
  const draftDocs = documents.filter(d => d.status === 'draft').length;
  const approvedDocs = documents.filter(d => d.status === 'approved').length;
  const openCRs = documents.filter(d => (d.folder === 'change-requests' || d.type === 'cr' || d.type === 'dcr') && d.status !== 'approved' && d.status !== 'rejected').length;
  const openSUPs = documents.filter(d => (d.folder === 'support-requests' || d.type === 'sup' || d.type === 'ma') && d.status !== 'approved' && d.status !== 'rejected').length;
  const pendingApprovals = documents.filter(d => d.folder === 'approvals' && d.status === 'pending').length;
  const scopeDocs = documents.filter(d => d.type === 'scope').length;
  const quotationDocs = documents.filter(d => d.type === 'quotation').length;

  // Scope readiness checks
  const scopeReady = scopeDocs > 0 && quotationDocs > 0;

  // Get next action
  const hasNoScope = scopeDocs === 0;
  const hasNoQuote = quotationDocs === 0;
  const hasOpenItems = openCRs > 0 || openSUPs > 0 || pendingApprovals > 0;

  let nextActionLabel = '';
  let nextActionDesc = '';
  if (hasNoScope) {
    nextActionLabel = 'สร้าง Scope';
    nextActionDesc = 'ยังไม่มีเอกสารขอบเขตงาน — สร้าง Scope เป็นตัวแรก';
  } else if (hasNoQuote) {
    nextActionLabel = 'สร้างใบเสนอราคา';
    nextActionDesc = 'Scope พร้อมแล้ว — เริ่มสร้างใบเสนอราคา';
  } else if (scopeReady && approvedDocs >= 2) {
    nextActionLabel = 'Scope พร้อม';
    nextActionDesc = 'Scope + Quotation พร้อม ขั้นตอนต่อไปคือส่งเขำ review';
  } else if (hasOpenItems) {
    nextActionLabel = 'จัดการรายการที่เปิดอยู่';
    nextActionDesc = `${openCRs + openSUPs + pendingApprovals} รายการรอดำเนินการ`;
  } else {
    nextActionLabel = 'เริ่มใหม่';
    nextActionDesc = 'ทุกอย่างเรียบร้อย — สรุปงานเป็น CR/DCR ได้ตลอด';
  }

  // Filtering and Searching
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (filterType !== 'all' && doc.type !== filterType && doc.folder !== filterType) return false;
      if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = doc.title.toLowerCase().includes(query) || doc.file_name.toLowerCase().includes(query) || doc.type.toLowerCase().includes(query) || doc.status.toLowerCase().includes(query) || doc.excerpt.toLowerCase().includes(query);
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
        <div className="flex gap-3">
          <button
            onClick={() => onCreateDocument(clientId, projectPath.split('/').pop() || '', projectPath)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> สร้างเอกสาร
          </button>
          <button
            onClick={loadDocuments}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-base font-medium hover:bg-white/10 transition-all duration-300 disabled:opacity-50 shadow-sm min-h-[44px]"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-section-lg">

        {/* NEXT BEST ACTION CARD */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)', borderColor: 'rgba(99,102,241,0.2)' }}>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-text mb-1">ตอนนี้ควรทำอะไรต่อ?</h2>
              <p className="text-2xl font-bold text-primary-light mb-3">{nextActionLabel}</p>
              <p className="text-sm text-text-muted leading-relaxed">{nextActionDesc}</p>
              
              {hasNoScope && (
                <button
                  onClick={() => onCreateDocument(clientId, projectPath.split('/').pop() || '', projectPath)}
                  className="btn btn-primary mt-5 px-6"
                >
                  สร้าง Scope แรก <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-text-dim font-medium uppercase tracking-wider mb-1">Scope Status</p>
              <p className={`text-sm font-bold ${scopeReady ? 'text-success' : hasNoScope ? 'text-text-dim' : 'text-warning'}`}>
                {hasNoScope ? 'ยังไม่มี' : scopeReady ? 'พร้อมแล้ว' : 'กำลังดำเนินการ'}
              </p>
            </div>
          </div>
        </div>

        {/* WARNINGS + ACTION REQUIRED */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Scope Readiness */}
          <div className="card">
            <h3 className="text-sm font-bold text-text-muted flex items-center gap-2.5 mb-4">
              <CheckCircle className="w-4 h-4" />
              Scope Readiness
            </h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-dim">Scope</span>
                <span className={`text-sm font-bold ${scopeDocs > 0 ? 'text-success' : 'text-text-dim'}`}>
                  {scopeDocs > 0 ? '✓ มี' : 'ยังไม่มี'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-dim">Quotation</span>
                <span className={`text-sm font-bold ${quotationDocs > 0 ? 'text-success' : 'text-text-dim'}`}>
                  {quotationDocs > 0 ? '✓ มี' : 'ยังไม่มี'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-dim">Approve</span>
                <span className={`text-sm font-bold ${approvedDocs >= 2 ? 'text-success' : approvedDocs > 0 ? 'text-warning' : 'text-text-dim'}`}>
                  {approvedDocs} เอกสาร
                </span>
              </div>
            </div>
          </div>

          {/* Missing / Risk warnings */}
          <div className="card">
            <h3 className="text-sm font-bold text-text-muted flex items-center gap-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-warning" />
              ความเสี่ยง
            </h3>
            <div className="flex flex-col gap-2.5">
              {hasNoScope && (
                <p className="text-sm text-warning font-medium">ยังไม่มี Scope — ขาดข้อมูล cornerstone</p>
              )}
              {hasNoScope && hasNoQuote && (
                <p className="text-sm text-warning font-medium">ยังไม่มี Quote — ลูกค้าไม่รู้ราคา</p>
              )}
              {openCRs > 0 && (
                <p className="text-sm text-warning font-medium">{openCRs} รายการ CR ยังไม่ได้ปิด</p>
              )}
              {pendingApprovals > 0 && (
                <p className="text-sm text-warning font-medium">{pendingApprovals} รายการรอการอนุมัติ</p>
              )}
              {!hasNoScope && !hasNoQuote && openCRs === 0 && pendingApprovals === 0 && (
                <p className="text-sm text-success font-medium">ไม่มีความเสี่ยงเด่น官 — ทุกอย่างดูดี</p>
              )}
            </div>
          </div>

          {/* Workflow Stage Cards */}
          <div className="card">
            <h3 className="text-sm font-bold text-text-muted flex items-center gap-2.5 mb-4">
              <FileText className="w-4 h-4" />
              ขั้นตอนงาน
            </h3>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-dim">Draft</span>
                <span className="badge badge-muted">{draftDocs} ฉบับร่าง</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-dim">Approved</span>
                <span className="badge badge-success">{approvedDocs} อนุมัติแล้ว</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-dim">CR/SUP</span>
                <span className="badge badge-warning">{(openCRs + openSUPs)} รายการ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="relative sm:w-48">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="form-select"
            >
              <option value="all">ทุกประเภท</option>
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="relative sm:w-48">
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

        {/* Document List - Secondary */}
        <div className="space-y-3 pb-8">
          {filteredDocs.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-14 h-14 text-text-dim/40 mb-5" />
              <p className="text-text-muted font-semibold text-lg">ยังไม่มีเอกสารในโครงการนี้</p>
              <p className="text-sm text-text-dim mt-2 max-w-sm">คลิก + ที่ชื่อโครงการในแถบด้านซ้ายเพื่อสร้างเอกสารใหม่</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Table header */}
              <div className="doc-table-header">
                <span>เอกสาร</span>
                <span>ประเภท</span>
                <span>สถานะ</span>
                <span>เลขที่</span>
                <span></span>
                <span>อัปเดต</span>
              </div>
              
              {filteredDocs.map((doc, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenDocument(doc.file_path)}
                  className="doc-table-row w-full text-left group"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-text group-hover:text-primary-light transition-colors text-sm truncate leading-relaxed">
                      {doc.title}
                    </div>
                    <div className="text-xs text-text-dim flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-mono text-text-muted">{doc.file_name}</span>
                      <span className="badge badge-muted" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{doc.folder}</span>
                    </div>
                  </div>
                  <span className="badge badge-primary uppercase" style={{ fontSize: '0.65rem' }}>{doc.type}</span>
                  <span className={`badge ${doc.status === 'approved' ? 'badge-success' : doc.status === 'pending' ? 'badge-warning' : doc.status === 'rejected' ? 'badge-error' : 'badge-muted'}`} style={{ fontSize: '0.65rem' }}>
                    {doc.status}
                  </span>
                  <span className="text-xs font-mono text-text-muted font-bold">{doc.document_number || `v${doc.version}`}</span>
                  <div className="flex items-center justify-center">
                    {doc.locked ? (
                      <div className="p-1 rounded-md bg-error/10 border border-error/20" title="ถูกล็อก">
                        <Lock className="w-3.5 h-3.5 text-error" />
                      </div>
                    ) : (
                      <span className="text-text-dim text-xs">-</span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap">{doc.updated || doc.created || '-'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}