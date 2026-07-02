import { useState, useEffect, useMemo } from 'react';
import { useProjectDocuments } from '../../hooks/useProjectDocuments';
import { t } from '../../lib/i18n/copy';
import { analyzeBriefScopeEvolution } from '../../lib/skills/brief-scope-evolution-skill';
import { FileEntry, readFileContent } from '../../lib/tauri-commands';
import { Send, FileText, FileCheck, Info, CheckCircle, AlertCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import type { BriefScopeEvolutionSession, BriefScopeIteration } from '../../lib/types';

interface ScopeWorkshopProps {
  projectPath: string;
  workspaceTree: FileEntry;
  workspacePath: string;
  onOpenDocument: (path: string) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, initialType?: string, lifecycleContext?: any) => void;
}

// Helper to extract list items from markdown based on headers
function extractListFromMarkdown(markdown: string, headerWords: string[]): string[] {
  const lines = markdown.split('\n');
  let capturing = false;
  const items: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      const isTarget = headerWords.some(w => line.toLowerCase().includes(w.toLowerCase()));
      if (isTarget) {
        capturing = true;
        continue;
      } else if (capturing) {
        break;
      }
    }
    
    if (capturing) {
      const match = line.match(/^[-*]\s+(.+)/);
      if (match) {
        items.push(match[1]);
      } else if (line.trim() && !line.startsWith('#')) {
        items.push(line.trim());
      }
    }
  }
  return items;
}

export default function ScopeWorkshop({ projectPath, workspaceTree, workspacePath, onOpenDocument, onCreateDocument }: ScopeWorkshopProps) {
  const { documents } = useProjectDocuments(projectPath, workspaceTree);

  const [customerInput, setCustomerInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [session, setSession] = useState<BriefScopeEvolutionSession | null>(null);
  const [expandedIterations, setExpandedIterations] = useState<Set<string>>(new Set());
  
  const normalized = projectPath.split('\\').join('/');
  const parts = normalized.split('/').filter(Boolean);
  const clientsIndex = parts.lastIndexOf('clients');
  const projectsIndex = parts.lastIndexOf('projects');
  const clientId = clientsIndex >= 0 && parts[clientsIndex + 1] ? parts[clientsIndex + 1] : '';
  const projectId = projectsIndex >= 0 && parts[projectsIndex + 1] ? parts[projectsIndex + 1] : parts[parts.length - 1] || '';

  const qualityBrief = useMemo(() => documents.find(doc => doc.type === 'brief' && (doc.status === 'approved' || doc.locked)) || documents.find(doc => doc.type === 'brief'), [documents]);
  const qualityScope = useMemo(() => documents.find(doc => doc.type === 'scope' && (doc.status === 'approved' || doc.locked)) || documents.find(doc => doc.type === 'scope'), [documents]);

  const [briefMarkdown, setBriefMarkdown] = useState('');
  const [scopeMarkdown, setScopeMarkdown] = useState('');

  useEffect(() => {
    async function loadContent() {
      if (qualityBrief) {
        setBriefMarkdown(qualityBrief.markdown || await readFileContent(qualityBrief.file_path));
      } else {
        setBriefMarkdown('');
      }
      
      if (qualityScope) {
        setScopeMarkdown(qualityScope.markdown || await readFileContent(qualityScope.file_path));
      } else {
        setScopeMarkdown('');
      }
    }
    loadContent();
  }, [qualityBrief, qualityScope]);

  useEffect(() => {
    if (!session) {
      setSession({
        id: crypto.randomUUID(),
        projectId,
        projectPath,
        status: 'Collecting brief',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentBriefSummary: '',
        currentScopeSummary: '',
        currentScopeStatus: qualityScope?.locked ? 'Locked' : qualityScope?.status === 'approved' ? 'Approved' : 'Draft',
        iterations: [],
      });
    }
  }, [session, projectId, projectPath, qualityScope]);

  const handleAnalyze = async () => {
    if (!customerInput.trim() || !session) return;
    
    setAnalyzing(true);
    try {
      const openFollowUps = documents.filter(d => (d.folder === 'support-requests' || d.type === 'sup' || d.type === 'ma') && d.status !== 'resolved' && d.status !== 'rejected').map(d => d.file_path);
      const openCRs = documents.filter(d => (d.folder === 'change-requests' || d.type === 'cr' || d.type === 'dcr') && d.status !== 'approved' && d.status !== 'rejected').map(d => d.file_path);

      const result = await analyzeBriefScopeEvolution(workspacePath, {
        previousBriefSummary: session.currentBriefSummary,
        previousScopeSummary: session.currentScopeSummary,
        currentBriefSummary: briefMarkdown,
        currentScopeSummary: scopeMarkdown,
        customerMessage: customerInput,
        openFollowUps,
        openChangeRequests: openCRs,
        quoteStatus: 'Draft',
        scopeStatus: session.currentScopeStatus,
        acceptanceStatus: 'Pending',
        approvalEvidence: ''
      });

      const newIteration: BriefScopeIteration = {
        id: crypto.randomUUID(),
        sequenceNumber: session.iterations.length + 1,
        createdAt: new Date().toISOString(),
        customerMessage: customerInput,
        customerMessageSummary: result.customerMessageSummary,
        previousBriefSnapshot: session.currentBriefSummary,
        previousScopeSnapshot: session.currentScopeSummary,
        briefChanges: result.briefChanges,
        scopeChanges: result.scopeChanges,
        quoteImpact: result.quoteImpact,
        acceptanceImpact: result.acceptanceImpact,
        missingQuestions: result.missingQuestions,
        recommendedAction: result.recommendedAction,
        riskLevel: result.riskLevel,
        confidence: result.confidence
      };

      setSession(prev => prev ? {
        ...prev,
        status: 'Scope changed',
        updatedAt: new Date().toISOString(),
        iterations: [newIteration, ...prev.iterations]
      } : null);

      setCustomerInput('');
    } catch (err) {
      console.error(err);
      alert('Analysis failed. Try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptScope = () => {
    setSession(prev => prev ? {
      ...prev,
      status: 'Accepted by user',
      acceptedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } : null);
  };

  const handleCloseLoop = () => {
    setSession(prev => prev ? {
      ...prev,
      status: 'Closed',
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } : null);
  };

  const handleCreateFollowUp = (question: string) => {
    onCreateDocument(clientId, projectId, projectPath, 'sup', {
      source: 'scope_workshop',
      reason: question,
      projectPath,
      recommendationWhy: 'Missing information from customer'
    });
  };

  const handleUpdateDocument = (type: 'brief' | 'scope' | 'cr', recommendation: string) => {
    onCreateDocument(clientId, projectId, projectPath, type, {
      source: 'scope_workshop',
      reason: `Update ${type} from customer input`,
      projectPath,
      recommendationWhy: recommendation
    });
  };

  const applyRecommendedAction = () => {
    if (!latestIteration) return;
    switch (latestIteration.recommendedAction) {
      case 'Update Brief':
        handleUpdateDocument('brief', latestIteration.briefChanges.join('\n'));
        break;
      case 'Update Scope':
        handleUpdateDocument('scope', latestIteration.scopeChanges.join('\n'));
        break;
      case 'Create Change Request':
        handleUpdateDocument('cr', latestIteration.scopeChanges.join('\n'));
        break;
      case 'Create Follow-up':
        if (latestIteration.missingQuestions.length > 0) {
          handleCreateFollowUp(latestIteration.missingQuestions[0]);
        }
        break;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIterations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const latestIteration = session?.iterations[0];

  const briefData = {
    goal: extractListFromMarkdown(briefMarkdown, ['goal', 'เป้าหมาย']),
    context: extractListFromMarkdown(briefMarkdown, ['context', 'บริบท']),
    users: extractListFromMarkdown(briefMarkdown, ['user', 'stakeholder', 'ผู้ใช้งาน']),
  };

  const scopeData = {
    inScope: extractListFromMarkdown(scopeMarkdown, ['in scope', 'ขอบเขต']),
    outOfScope: extractListFromMarkdown(scopeMarkdown, ['out of scope', 'นอกขอบเขต']),
    deliverables: extractListFromMarkdown(scopeMarkdown, ['deliverable', 'ส่งมอบ']),
  };

  return (
    <div className="flex flex-col h-full bg-surface-1 overflow-hidden">
      {/* Header */}
      <header className="flex-none p-4 border-b border-border bg-surface-2/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-primary-light" />
          <div>
            <h1 className="text-lg font-bold text-text leading-tight">{t('scopeWorkshop.title')}</h1>
            <p className="text-xs text-text-dim">Project Scope Evolution Timeline</p>
          </div>
        </div>
        
        {session && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-surface-3 border border-border text-text">
              Status: {session.status}
            </span>
            {session.status !== 'Closed' && (
              <>
                <button onClick={handleAcceptScope} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t('scopeWorkshop.acceptScope')}
                </button>
                <button onClick={handleCloseLoop} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {t('scopeWorkshop.closeScopeLoop')}
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Grid Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          
          {/* Left Column: Customer Input */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="bg-surface-2 rounded-xl border border-border p-4 flex flex-col gap-3 shadow-lg">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <Send className="w-4 h-4 text-accent" />
                {t('scopeWorkshop.pasteCustomerMessage')}
              </h2>
              <textarea
                className="w-full h-32 bg-surface-3 border border-white/10 rounded-lg p-3 text-sm text-text placeholder-text-dim/50 resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
                placeholder="Paste customer emails, meeting notes, Line chat messages..."
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                disabled={session?.status === 'Closed' || analyzing}
              />
              <button 
                className="btn-primary w-full py-2 flex items-center justify-center gap-2"
                onClick={handleAnalyze}
                disabled={!customerInput.trim() || session?.status === 'Closed' || analyzing}
              >
                {analyzing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Info className="w-4 h-4" />
                )}
                {t('scopeWorkshop.analyzeBriefScope')}
              </button>
            </div>
          </div>

          {/* Center Column: Current Brief/Scope */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="bg-surface-2 rounded-xl border border-border p-4 shadow-lg flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-light" />
                  {t('scopeWorkshop.currentBrief')}
                </h2>
                {qualityBrief && (
                  <button onClick={() => onOpenDocument(qualityBrief.file_path)} className="text-xs text-primary-light hover:underline">
                    View full
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-text-muted mb-1">Goal</h3>
                  <ul className="list-disc pl-4 text-sm text-text">
                    {briefData.goal.length > 0 ? briefData.goal.map((g, i) => <li key={i}>{g}</li>) : <li className="text-text-dim italic">ยังไม่มีข้อมูล</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-text-muted mb-1">Business Context</h3>
                  <ul className="list-disc pl-4 text-sm text-text">
                    {briefData.context.length > 0 ? briefData.context.map((c, i) => <li key={i}>{c}</li>) : <li className="text-text-dim italic">ยังไม่มีข้อมูล</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-surface-2 rounded-xl border border-border p-4 shadow-lg flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-accent" />
                  {t('scopeWorkshop.latestScope')}
                </h2>
                {qualityScope && (
                  <button onClick={() => onOpenDocument(qualityScope.file_path)} className="text-xs text-primary-light hover:underline">
                    View full
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-text-muted mb-1">In Scope</h3>
                  <ul className="list-disc pl-4 text-sm text-text">
                    {scopeData.inScope.length > 0 ? scopeData.inScope.map((s, i) => <li key={i}>{s}</li>) : <li className="text-text-dim italic">ยังไม่มีข้อมูล</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-text-muted mb-1">Deliverables</h3>
                  <ul className="list-disc pl-4 text-sm text-text">
                    {scopeData.deliverables.length > 0 ? scopeData.deliverables.map((d, i) => <li key={i}>{d}</li>) : <li className="text-text-dim italic">ยังไม่มีข้อมูล</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Suggested Action & Missing Questions */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            {latestIteration ? (
              <div className="bg-surface-2 rounded-xl border border-primary/50 p-4 shadow-[0_0_15px_rgba(var(--color-primary),0.1)] flex flex-col">
                <h2 className="text-sm font-bold text-primary-light flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4" />
                  {t('scopeWorkshop.recommendedNextAction')}
                </h2>
                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border border-white/5 bg-surface-3 rounded-lg mb-4">
                  <span className="text-lg font-bold text-text mb-2">{latestIteration.recommendedAction}</span>
                  <span className="text-xs text-text-muted">
                    {latestIteration.scopeChanges.length > 0 ? 'เพราะข้อมูลนี้เปลี่ยนขอบเขตงาน' : 'เพราะลูกค้าเพิ่ม requirement ใหม่'}
                  </span>
                </div>

                {latestIteration.missingQuestions.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-warning flex items-center gap-1 mb-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t('scopeWorkshop.missingInfo')}
                    </h3>
                    <ul className="list-disc pl-4 text-sm text-text-muted space-y-1">
                      {latestIteration.missingQuestions.map((q, i) => (
                        <li key={i} className="mb-2">
                          <div className="flex flex-col gap-1 items-start">
                            <span>{q}</span>
                            <button 
                              onClick={() => handleCreateFollowUp(q)}
                              className="text-xs text-primary-light hover:text-primary bg-primary/10 px-2 py-1 rounded"
                            >
                              {t('scopeWorkshop.createFollowUp')}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <button onClick={applyRecommendedAction} className="btn-primary w-full py-2">Apply {latestIteration.recommendedAction}</button>
              </div>
            ) : (
              <div className="bg-surface-2 rounded-xl border border-border p-4 shadow-lg flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <AlertCircle className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-sm text-text-muted">Analyze customer message to see recommended next action.</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Full Width: Evolution History */}
        <div className="bg-surface-2 rounded-xl border border-border p-4 shadow-lg">
          <h2 className="text-base font-bold text-text mb-4">{t('scopeWorkshop.evolutionHistory')}</h2>
          
          <div className="flex flex-col gap-3">
            {session?.iterations.map((iter) => {
              const isExpanded = expandedIterations.has(iter.id);
              return (
                <div key={iter.id} className="border border-white/10 bg-surface-3 rounded-lg overflow-hidden transition-all">
                  {/* Collapsed Header */}
                  <div 
                    className="p-3 cursor-pointer flex items-center justify-between hover:bg-white/5"
                    onClick={() => toggleExpand(iter.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold bg-primary/20 text-primary-light px-2 py-1 rounded">
                        {t('scopeWorkshop.iterationNumber')} {iter.sequenceNumber}
                      </span>
                      <span className="text-sm text-text">{new Date(iter.createdAt).toLocaleString()}</span>
                      <span className="text-sm font-semibold text-text max-w-xs truncate">{iter.customerMessageSummary}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {iter.briefChanges.length > 0 && <span className="text-xs text-text-muted px-2 py-0.5 border border-white/10 rounded-full">Brief Impact</span>}
                      {iter.scopeChanges.length > 0 && <span className="text-xs text-text-muted px-2 py-0.5 border border-white/10 rounded-full">Scope Impact</span>}
                      <span className="text-xs font-bold text-accent">{iter.recommendedAction}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-1/50">
                      <div>
                        <h4 className="text-xs font-bold text-text-muted mb-2">{t('scopeWorkshop.newCustomerMessage')}</h4>
                        <p className="text-sm text-text whitespace-pre-wrap bg-surface-2 p-3 rounded border border-white/5">{iter.customerMessage}</p>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-text-muted mb-2">{t('scopeWorkshop.whatChanged')}</h4>
                          <ul className="list-disc pl-4 text-sm text-text">
                            {iter.briefChanges.map((b, i) => <li key={`b-${i}`}>{b}</li>)}
                            {iter.scopeChanges.map((s, i) => <li key={`s-${i}`}>{s}</li>)}
                          </ul>
                        </div>
                        
                        {(iter.quoteImpact || iter.acceptanceImpact) && (
                          <div className="flex gap-4">
                            <div className="flex-1 bg-surface-2 p-2 rounded border border-white/5">
                              <span className="text-[10px] uppercase font-bold text-text-dim block mb-1">Quote Impact</span>
                              <span className="text-xs text-text">{iter.quoteImpact || 'None'}</span>
                            </div>
                            <div className="flex-1 bg-surface-2 p-2 rounded border border-white/5">
                              <span className="text-[10px] uppercase font-bold text-text-dim block mb-1">Acceptance Impact</span>
                              <span className="text-xs text-text">{iter.acceptanceImpact || 'None'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {(!session?.iterations || session.iterations.length === 0) && (
              <div className="p-8 text-center text-text-muted text-sm border border-dashed border-white/10 rounded-lg">
                ยังไม่มีข้อมูลประวัติการเปลี่ยนแปลง เริ่มต้นโดยการวางข้อความลูกค้าและวิเคราะห์
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
