import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProjectDocument, scanProjectDocuments } from '../lib/document-scanner';
import { FileEntry } from '../lib/tauri-commands';
import {
  RefreshCw, FileText, Search, Lock, CheckCircle, Briefcase, ArrowRight, AlertTriangle, Target, Plus
} from 'lucide-react';
import SelectField from './ui/SelectField';

interface ProjectOverviewProps {
  projectPath: string;
  projectName: string;
  workspaceTree: FileEntry;
  onOpenDocument: (path: string) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, initialType?: string) => void;
  onStartBriefIntake?: (clientId: string, projectId: string, projectPath: string) => void;
}

export default function ProjectOverview({ projectPath, projectName, workspaceTree, onOpenDocument, onCreateDocument, onStartBriefIntake }: ProjectOverviewProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadDocuments = useCallback(async () => {
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
  }, [projectPath, workspaceTree]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Extract clientId from path
  const clientId = projectPath.split('/').slice(-2, -1)[0] || '';

  // Derived Summary Counts
  const briefDocs = documents.filter(d => d.type === 'brief').length;
  const draftDocs = documents.filter(d => d.status === 'draft').length;
  const approvedDocs = documents.filter(d => d.status === 'approved').length;
  const openCRs = documents.filter(d => (d.folder === 'change-requests' || d.type === 'cr' || d.type === 'dcr') && d.status !== 'approved' && d.status !== 'rejected').length;
  const openSUPs = documents.filter(d => (d.folder === 'support-requests' || d.type === 'sup' || d.type === 'ma') && d.status !== 'approved' && d.status !== 'rejected').length;
  const pendingApprovals = documents.filter(d => d.folder === 'approvals' && d.status === 'pending').length;
  const scopeDocs = documents.filter(d => d.type === 'scope').length;
  const quotationDocs = documents.filter(d => d.type === 'quotation').length;

  // Primary reference document for readiness
  const primaryScope = documents.find(d => d.type === 'scope' && d.status === 'approved') || 
                       documents.find(d => d.type === 'scope') || 
                       documents.find(d => d.type === 'brief');
  
  const contentFlags = primaryScope?.content_flags || {
    hasGoal: false,
    hasInScope: false,
    hasOutOfScope: false,
    hasDeliverables: false,
    hasAcceptance: false,
    hasAssumptions: false,
    hasQuestions: false,
  };

  // Scope readiness checks
  const scopeReady = scopeDocs > 0 && quotationDocs > 0;

  // Get next action
  const hasNoBrief = briefDocs === 0;
  const hasNoScope = scopeDocs === 0;
  const hasNoQuote = quotationDocs === 0;
  const hasOpenItems = openCRs > 0 || openSUPs > 0 || pendingApprovals > 0;

  let nextActionLabel: string;
  let nextActionDesc: string;
  if (hasNoBrief && hasNoScope) {
    nextActionLabel = 'สร้างร่าง Brief';
    nextActionDesc = 'ยังไม่มีเอกสารใดๆ — แปะคำขอลูกค้าเพื่อสร้างโครงร่างแรก';
  } else if (hasNoScope) {
    nextActionLabel = 'สร้าง Scope';
    nextActionDesc = 'มีร่าง Brief แล้ว — สร้าง Scope เพื่อตีกรอบให้ชัดเจน';
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

        {/* WORKFLOW PROGRESS STEPPER */}
        <div className="card !p-8 relative overflow-hidden">
          {/* Subtle background glow for active stepper */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-text mb-1">ขั้นตอนการทำงาน (Workflow)</h2>
              <p className="text-sm text-text-muted">ดำเนินการตามขั้นตอนเพื่อส่งมอบงาน</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-dim font-medium uppercase tracking-wider mb-1">Scope Status</p>
              <p className={`text-sm font-bold ${scopeReady ? 'text-success' : (hasNoScope && hasNoBrief) ? 'text-text-dim' : 'text-warning'}`}>
                {(hasNoScope && hasNoBrief) ? 'ยังไม่มี' : scopeReady ? 'พร้อมแล้ว' : 'กำลังดำเนินการ'}
              </p>
            </div>
          </div>

          <div className="relative z-10 px-4">
            {/* Connecting Line */}
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-surface-3 z-0" />
            <div 
              className="absolute top-8 left-[12.5%] h-0.5 bg-primary z-0 transition-all duration-700 ease-in-out" 
              style={{ width: `${hasNoBrief ? 0 : hasNoScope ? 33 : hasNoQuote ? 66 : 100}%` }} 
            />

            <div className="flex justify-between relative z-10">
              {/* Step 1: Brief */}
              <div className="flex flex-col items-center group w-1/4 relative">
                <button
                  onClick={() => {
                    if (hasNoBrief && onStartBriefIntake) {
                      onStartBriefIntake(clientId, projectPath.split('/').pop() || '', projectPath);
                    }
                  }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
                    !hasNoBrief 
                      ? 'bg-success/20 text-success border border-success/30' 
                      : 'bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 cursor-pointer'
                  }`}
                  disabled={!hasNoBrief}
                >
                  {!hasNoBrief ? <CheckCircle className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                </button>
                <span className={`font-semibold text-sm ${hasNoBrief ? 'text-primary-light' : 'text-text'}`}>1. สร้าง Brief</span>
                <span className="text-xs text-text-dim mt-1 text-center">{!hasNoBrief ? 'เสร็จสิ้น' : 'รวบรวมความต้องการ'}</span>
              </div>

              {/* Step 2: Scope */}
              <div className="flex flex-col items-center group w-1/4 relative">
                <button
                  onClick={() => {
                    if (!hasNoBrief && hasNoScope) {
                      onCreateDocument(clientId, projectPath.split('/').pop() || '', projectPath, 'scope');
                    }
                  }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
                    !hasNoScope 
                      ? 'bg-success/20 text-success border border-success/30' 
                      : (!hasNoBrief && hasNoScope) 
                        ? 'bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 cursor-pointer' 
                        : 'bg-surface-2 text-text-dim border border-border cursor-not-allowed'
                  }`}
                  disabled={hasNoBrief || !hasNoScope}
                >
                  {!hasNoScope ? <CheckCircle className="w-7 h-7" /> : <Target className="w-7 h-7" />}
                </button>
                <span className={`font-semibold text-sm ${(!hasNoBrief && hasNoScope) ? 'text-primary-light' : !hasNoScope ? 'text-text' : 'text-text-muted'}`}>2. สร้าง Scope</span>
                <span className="text-xs text-text-dim mt-1 text-center">{!hasNoScope ? 'เสร็จสิ้น' : 'กำหนดขอบเขตงาน'}</span>
              </div>

              {/* Step 3: Quotation */}
              <div className="flex flex-col items-center group w-1/4 relative">
                <button
                  onClick={() => {
                    if (!hasNoScope && hasNoQuote) {
                      onCreateDocument(clientId, projectPath.split('/').pop() || '', projectPath, 'quotation');
                    }
                  }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
                    !hasNoQuote 
                      ? 'bg-success/20 text-success border border-success/30' 
                      : (!hasNoScope && hasNoQuote) 
                        ? 'bg-primary/20 text-primary border-2 border-primary ring-4 ring-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 cursor-pointer' 
                        : 'bg-surface-2 text-text-dim border border-border cursor-not-allowed'
                  }`}
                  disabled={hasNoScope || !hasNoQuote}
                >
                  {!hasNoQuote ? <CheckCircle className="w-7 h-7" /> : <Briefcase className="w-7 h-7" />}
                </button>
                <span className={`font-semibold text-sm ${(!hasNoScope && hasNoQuote) ? 'text-primary-light' : !hasNoQuote ? 'text-text' : 'text-text-muted'}`}>3. เสนอราคา</span>
                <span className="text-xs text-text-dim mt-1 text-center">{!hasNoQuote ? 'เสร็จสิ้น' : 'ออกใบเสนอราคา'}</span>
              </div>

              {/* Step 4: Review */}
              <div className="flex flex-col items-center group w-1/4 relative">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
                    approvedDocs >= 2 
                      ? 'bg-success/20 text-success border border-success/30' 
                      : (!hasNoQuote && approvedDocs < 2) 
                        ? 'bg-warning/20 text-warning border-2 border-warning ring-4 ring-warning/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                        : 'bg-surface-2 text-text-dim border border-border'
                  }`}
                >
                  {approvedDocs >= 2 ? <CheckCircle className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                </div>
                <span className={`font-semibold text-sm ${(!hasNoQuote && approvedDocs < 2) ? 'text-warning' : approvedDocs >= 2 ? 'text-text' : 'text-text-muted'}`}>4. อนุมัติ</span>
                <span className="text-xs text-text-dim mt-1 text-center">{approvedDocs >= 2 ? 'อนุมัติครบถ้วน' : 'รอการอนุมัติ'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* WARNINGS + ACTION REQUIRED */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Scope Readiness */}
          <div className="card lg:col-span-3">
            <h3 className="text-sm font-bold text-text-muted flex items-center gap-2.5 mb-4">
              <CheckCircle className="w-4 h-4" />
              ความพร้อมของขอบเขตงาน (Scope Readiness)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">เอกสารตั้งต้น</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${(briefDocs > 0 || scopeDocs > 0) ? 'text-success' : 'text-warning'}`}>
                  {(briefDocs > 0 || scopeDocs > 0) ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Brief / Scope
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">เป้าหมายงาน</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${contentFlags.hasGoal ? 'text-success' : 'text-warning'}`}>
                  {contentFlags.hasGoal ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Goal / Overview
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">ขอบเขตงาน</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${contentFlags.hasInScope ? 'text-success' : 'text-warning'}`}>
                  {contentFlags.hasInScope ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  In-Scope
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">อยู่นอกขอบเขต</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${contentFlags.hasOutOfScope ? 'text-success' : 'text-warning'}`}>
                  {contentFlags.hasOutOfScope ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Out-of-Scope
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">สิ่งที่ส่งมอบ</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${contentFlags.hasDeliverables ? 'text-success' : 'text-warning'}`}>
                  {contentFlags.hasDeliverables ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Deliverables
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">เกณฑ์ตรวจรับ</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${contentFlags.hasAcceptance ? 'text-success' : 'text-warning'}`}>
                  {contentFlags.hasAcceptance ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Acceptance Criteria
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">เงื่อนไขเพิ่มเติม</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${contentFlags.hasAssumptions ? 'text-success' : 'text-warning'}`}>
                  {contentFlags.hasAssumptions ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Assumptions
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">สิ่งที่ยังไม่ชัดเจน</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${contentFlags.hasQuestions ? 'text-warning' : 'text-text-dim'}`}>
                  {contentFlags.hasQuestions ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  {contentFlags.hasQuestions ? 'มีคำถาม/สมมติฐาน' : 'เคลียร์แล้ว'}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">ใบเสนอราคา</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${quotationDocs > 0 ? 'text-success' : 'text-warning'}`}>
                  {quotationDocs > 0 ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Quotation
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-lg bg-surface-2 border border-border">
                <span className="text-xs text-text-dim uppercase tracking-wider">อนุมัติแล้ว</span>
                <span className={`text-sm font-bold flex items-center gap-1.5 ${approvedDocs >= 2 ? 'text-success' : 'text-warning'}`}>
                  {approvedDocs >= 2 ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Approval ({approvedDocs})
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
            <SelectField
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'all', label: 'ทุกประเภท' },
                ...uniqueTypes.map(t => ({ value: t, label: t }))
              ]}
            />
          </div>
          <div className="relative sm:w-48">
            <SelectField
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'ทุกสถานะ' },
                ...uniqueStatuses.map(s => ({ value: s, label: s }))
              ]}
            />
          </div>
        </div>

        {/* Document List - Secondary */}
        <div className="space-y-3 pb-8">
          {filteredDocs.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-14 h-14 text-text-dim/40 mb-5" />
              <p className="text-text-muted font-semibold text-lg">ยังไม่มีเอกสารในโปรเจกต์นี้</p>
              <p className="text-sm text-text-dim mt-2 max-w-sm mb-6">เริ่มจากคำขอลูกค้าเพื่อสร้าง Brief หรือสร้าง Scope โดยตรง</p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const normalized = projectPath.replace(/\\/g, '/');
                    const projId = normalized.split('/').pop() || '';
                    if (onStartBriefIntake) {
                      onStartBriefIntake(clientId, projId, projectPath);
                    } else {
                      onCreateDocument(clientId, projId, projectPath, 'brief');
                    }
                  }}
                  className="btn btn-ghost"
                >
                  เริ่มจากคำขอลูกค้า
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const normalized = projectPath.replace(/\\/g, '/');
                    const projId = normalized.split('/').pop() || '';
                    onCreateDocument(clientId, projId, projectPath, 'scope');
                  }}
                  className="btn btn-primary"
                >
                  สร้าง Scope
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}