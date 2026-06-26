import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProjectDocument, scanProjectDocuments } from '../lib/document-scanner';
import { FileEntry } from '../lib/tauri-commands';
import { computeProjectWorkflow } from '../lib/project-workflow';

export function useProjectDocuments(projectPath: string, workspaceTree: FileEntry) {
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

  const briefDocs = documents.filter(d => d.type === 'brief').length;
  const draftDocs = documents.filter(d => d.status === 'draft').length;
  const approvedDocs = documents.filter(d => d.status === 'approved').length;
  const openCRs = documents.filter(d => (d.folder === 'change-requests' || d.type === 'cr' || d.type === 'dcr') && d.status !== 'approved' && d.status !== 'rejected').length;
  const openSUPs = documents.filter(d => (d.folder === 'support-requests' || d.type === 'sup' || d.type === 'ma') && d.status !== 'approved' && d.status !== 'rejected').length;
  const pendingApprovals = documents.filter(d => d.folder === 'approvals' && d.status === 'pending').length;
  const scopeDocs = documents.filter(d => d.type === 'scope').length;
  const quotationDocs = documents.filter(d => d.type === 'quotation').length;
  const invoiceDocs = documents.filter(d => d.type === 'invoice').length;

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

  const scopeReady = scopeDocs > 0 && quotationDocs > 0;
  const hasNoBrief = briefDocs === 0;
  const hasNoScope = scopeDocs === 0;
  const hasNoQuote = quotationDocs === 0;

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

  const workflowState = useMemo(() => computeProjectWorkflow(documents), [documents]);

  return {
    documents,
    loading,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    loadDocuments,
    briefDocs,
    draftDocs,
    approvedDocs,
    openCRs,
    openSUPs,
    pendingApprovals,
    scopeDocs,
    quotationDocs,
    invoiceDocs,
    contentFlags,
    scopeReady,
    hasNoBrief,
    hasNoScope,
    hasNoQuote,
    workflowState,
    filteredDocs,
    uniqueTypes,
    uniqueStatuses
  };
}
