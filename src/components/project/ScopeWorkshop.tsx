import { useState, useEffect, useMemo } from 'react';
import { useProjectDocuments } from '../../hooks/useProjectDocuments';
import { t } from '../../lib/i18n/copy';
import { analyzeScopeLoopInput } from '../../lib/ai/scope-workshop-analyzer';
import { FileEntry, readFileContent } from '../../lib/tauri-commands';
import { Send, FileText, FileCheck, Info, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import type { ScopeLoopSession, ScopeLoopIteration } from '../../lib/types';

interface ScopeWorkshopProps {
  projectPath: string;
  workspaceTree: FileEntry;
  workspacePath: string;
  onOpenDocument: (path: string) => void;
  onCreateDocument: (clientId: string, projectId: string, projectPath: string, initialType?: string, lifecycleContext?: any) => void;
}

export default function ScopeWorkshop({ projectPath, workspaceTree, workspacePath, onOpenDocument, onCreateDocument }: ScopeWorkshopProps) {
  const { documents } = useProjectDocuments(projectPath, workspaceTree);

  const [customerInput, setCustomerInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [session, setSession] = useState<ScopeLoopSession | null>(null);
  
  // Extract project/client ids
  const normalized = projectPath.split('\\').join('/');
  const parts = normalized.split('/').filter(Boolean);
  const clientsIndex = parts.lastIndexOf('clients');
  const projectsIndex = parts.lastIndexOf('projects');
  const clientId = clientsIndex >= 0 && parts[clientsIndex + 1] ? parts[clientsIndex + 1] : '';
  const projectId = projectsIndex >= 0 && parts[projectsIndex + 1] ? parts[projectsIndex + 1] : parts[parts.length - 1] || '';

  // Current documents
  const qualityBrief = useMemo(() => documents.find(doc => doc.type === 'brief' && (doc.status === 'approved' || doc.locked)) || documents.find(doc => doc.type === 'brief'), [documents]);
  const qualityScope = useMemo(() => documents.find(doc => doc.type === 'scope' && (doc.status === 'approved' || doc.locked)) || documents.find(doc => doc.type === 'scope'), [documents]);

  const [briefMarkdown, setBriefMarkdown] = useState('');
  const [scopeMarkdown, setScopeMarkdown] = useState('');

  useEffect(() => {
    async function loadContent() {
      if (qualityBrief) {
        if (qualityBrief.markdown) {
          setBriefMarkdown(qualityBrief.markdown);
        } else {
          setBriefMarkdown(await readFileContent(qualityBrief.file_path));
        }
      } else {
        setBriefMarkdown('');
      }
      
      if (qualityScope) {
        if (qualityScope.markdown) {
          setScopeMarkdown(qualityScope.markdown);
        } else {
          setScopeMarkdown(await readFileContent(qualityScope.file_path));
        }
      } else {
        setScopeMarkdown('');
      }
    }
    loadContent();
  }, [qualityBrief, qualityScope]);

  // Initialize Session
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
        iterations: [],
      });
    }
  }, [session, projectId, projectPath]);

  const handleAnalyze = async () => {
    if (!customerInput.trim() || !session) return;
    
    setAnalyzing(true);
    try {
      const openFollowUps = documents.filter(d => (d.folder === 'support-requests' || d.type === 'sup' || d.type === 'ma') && d.status !== 'resolved' && d.status !== 'rejected').map(d => d.file_path);
      const openCRs = documents.filter(d => (d.folder === 'change-requests' || d.type === 'cr' || d.type === 'dcr') && d.status !== 'approved' && d.status !== 'rejected').map(d => d.file_path);

      const result = await analyzeScopeLoopInput(
        workspacePath,
        customerInput,
        briefMarkdown,
        scopeMarkdown,
        openFollowUps,
        openCRs,
        qualityScope?.status,
        qualityScope?.locked
      );

      const newIteration: ScopeLoopIteration = {
        id: crypto.randomUUID(),
        customerMessage: customerInput,
        summaryOfChange: result.summaryOfChange,
        briefDelta: result.briefDelta,
        scopeDelta: result.scopeDelta,
        quoteImpact: result.quoteImpact,
        acceptanceImpact: result.acceptanceImpact,
        missingQuestions: result.missingQuestions,
        recommendedAction: result.recommendedAction,
        createdAt: new Date().toISOString()
      };

      setSession(prev => prev ? {
        ...prev,
        status: 'Scope changed',
        updatedAt: new Date().toISOString(),
        iterations: [...prev.iterations, newIteration]
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

  const latestIteration = session?.iterations.length ? session.iterations[session.iterations.length - 1] : null;

  return (
    <div className="flex flex-col h-full bg-surface-1 overflow-hidden">
      {/* Header */}
      <header className="flex-none p-4 border-b border-border bg-surface-2/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-primary-light" />
          <div>
            <h1 className="text-lg font-bold text-text leading-tight">{t('scopeWorkshop.title')}</h1>
            <p className="text-xs text-text-dim">Workspace for iterative Brief to Scope translation</p>
          </div>
        </div>
        
        {session && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-surface-3 border border-border">
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="h-full flex flex-col md:flex-row gap-4 p-4 min-w-0">
          
          {/* Left Column: Customer Input & Conversation */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="bg-surface-2 rounded-xl border border-border p-4 flex flex-col gap-3 shadow-lg flex-none">
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

            {/* Loop History / Latest Delta */}
            <div className="bg-surface-2 rounded-xl border border-border p-4 flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 shadow-lg">
              <h2 className="text-sm font-bold text-text">{t('scopeWorkshop.whatChanged')}</h2>
              
              {latestIteration ? (
                <div className="flex flex-col gap-3 text-sm">
                  <div className="bg-surface-3 p-3 rounded-lg border border-white/5 break-words">
                    <p className="font-semibold text-text-muted mb-1 text-xs">Customer Message:</p>
                    <p className="text-text">{latestIteration.customerMessage}</p>
                  </div>

                  <div className="bg-surface-3 p-3 rounded-lg border border-white/5 break-words">
                    <p className="font-semibold text-text-muted mb-1 text-xs">Analysis:</p>
                    <p className="text-text whitespace-pre-wrap">{latestIteration.summaryOfChange}</p>
                  </div>

                  {latestIteration.missingQuestions.length > 0 && (
                    <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
                      <p className="font-semibold text-warning mb-2 text-xs flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {t('scopeWorkshop.missingInfo')}
                      </p>
                      <ul className="list-disc pl-4 space-y-2">
                        {latestIteration.missingQuestions.map((q, idx) => (
                          <li key={idx} className="text-text-muted text-sm break-words">
                            <div className="flex flex-col gap-2">
                              <span>{q}</span>
                              <button 
                                onClick={() => handleCreateFollowUp(q)}
                                className="self-start text-xs text-primary-light hover:text-primary bg-primary/10 px-2 py-1 rounded"
                              >
                                {t('scopeWorkshop.createFollowUp')}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-2 flex flex-col gap-2">
                    <p className="font-semibold text-text-muted text-xs">Recommended Action: {latestIteration.recommendedAction}</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleUpdateDocument('brief', latestIteration.briefDelta)} className="btn-secondary text-xs px-3 py-1.5 flex-1 min-w-[120px]">
                        {t('scopeWorkshop.updateBrief')}
                      </button>
                      <button onClick={() => handleUpdateDocument('scope', latestIteration.scopeDelta)} className="btn-secondary text-xs px-3 py-1.5 flex-1 min-w-[120px]">
                        {t('scopeWorkshop.updateScope')}
                      </button>
                      <button onClick={() => handleUpdateDocument('cr', latestIteration.summaryOfChange)} className="btn-secondary text-xs px-3 py-1.5 flex-1 min-w-[120px] text-warning hover:bg-warning/10 border-warning/30">
                        {t('scopeWorkshop.createChangeRequest')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-dim text-sm italic text-center p-4">
                  Paste a customer message above to see what changes.
                </div>
              )}
            </div>
          </div>

          {/* Center Column: Current Brief */}
          <div className="flex-1 min-w-0 bg-surface-2 rounded-xl border border-border flex flex-col shadow-lg">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <FileText className="w-4 h-4 text-text-muted" />
                {t('scopeWorkshop.currentBrief')}
              </h2>
              {qualityBrief && (
                <button onClick={() => onOpenDocument(qualityBrief.file_path)} className="text-xs text-primary-light hover:underline">
                  View full
                </button>
              )}
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {briefMarkdown ? (
                <div className="prose prose-invert prose-sm max-w-none break-words whitespace-pre-wrap">
                  {briefMarkdown}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-text-dim text-sm italic">
                  No brief document found.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Latest Scope */}
          <div className="flex-1 min-w-0 bg-surface-2 rounded-xl border border-border flex flex-col shadow-lg">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-text flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-text-muted" />
                {t('scopeWorkshop.latestScope')}
              </h2>
              {qualityScope && (
                <button onClick={() => onOpenDocument(qualityScope.file_path)} className="text-xs text-primary-light hover:underline">
                  View full
                </button>
              )}
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {scopeMarkdown ? (
                <div className="prose prose-invert prose-sm max-w-none break-words whitespace-pre-wrap">
                  {scopeMarkdown}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-text-dim text-sm italic">
                  No scope document found.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
