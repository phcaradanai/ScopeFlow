import { useState, useEffect } from 'react';
import { useWorkspace } from '../lib/workspace-context';
import { scanProjectDocuments } from '../lib/document-scanner';
import { checkWorkspaceHealth } from '../lib/workspace-health';
import { getCompanyProfile } from '../lib/settings';
import { pathExists, readFileContent, writeFileContent } from '../lib/tauri-commands';
import { generateDemoWorkspace } from '../lib/demo-generator';
import { openPath } from '@tauri-apps/plugin-opener';
import YAML from 'yaml';
import {
  getProjectPaths,
  computeWorkspaceStats,
  determineCompanyProfileStatus,
  determinePresetsStatus,
  determineHealthStatusSummary
} from '../lib/workspace-scanner';
import { FolderOpen, AlertTriangle, Plus } from 'lucide-react';
import PageShell from './ui/PageShell';
import WorkspaceStats from './workspace/WorkspaceStats';
import ClientList from './workspace/ClientList';
import WorkspaceStatus from './workspace/WorkspaceStatus';
import MaintenanceActions from './workspace/MaintenanceActions';

interface WorkspaceOverviewProps {
  onCreateClient: () => void;
  onRunHealthCheck: () => void;
  onBackupWorkspace: () => void;
  onCreateProject: (clientId: string) => void;
}

export default function WorkspaceOverview({
  onCreateClient,
  onRunHealthCheck,
  onBackupWorkspace,
  onCreateProject,
}: WorkspaceOverviewProps) {
  const { workspacePath, workspaceName, tree, refreshTree, setSelectedFile } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [workspaceVersion, setWorkspaceVersion] = useState('1.0');
  const [createdDate, setCreatedDate] = useState('');
  
  // Counts
  const [clientsCount, setClientsCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [lockedCount, setLockedCount] = useState(0);
  
  // Statuses
  const [companyProfileStatus, setCompanyProfileStatus] = useState<'configured' | 'missing' | 'malformed'>('missing');
  const [presetsStatus, setPresetsStatus] = useState<'configured' | 'missing' | 'malformed'>('missing');
  const [healthStatus, setHealthStatus] = useState<'OK' | 'Warning' | 'Error'>('OK');
  const [healthIssues, setHealthIssues] = useState<any[]>([]);
  
  // Backup / Export
  const [lastBackup, setLastBackup] = useState('ยังไม่ได้สำรองข้อมูล');
  const [latestExport, setLatestExport] = useState('ยังไม่มีข้อมูลการส่งออก');

  useEffect(() => {
    if (!workspacePath) return;
    const currentPath = workspacePath;

    async function loadWorkspaceInfo() {
      setLoading(true);
      try {
        const yamlPath = `${currentPath}/scopeflow.yaml`;
        if (await pathExists(yamlPath)) {
          const yamlContent = await readFileContent(yamlPath);
          try {
            const config = YAML.parse(yamlContent);
            if (config?.workspace) {
              setWorkspaceVersion(config.workspace.version || '1.0');
              if (config.workspace.created) {
                const date = new Date(config.workspace.created);
                setCreatedDate(isNaN(date.getTime()) ? config.workspace.created : date.toLocaleDateString('th-TH'));
              }
            }
          } catch {
            // Gracefully ignore parsing errors
          }
        }

        const projects = getProjectPaths(tree);
        const clients = tree?.children || [];
        setClientsCount(clients.length);
        setProjectsCount(projects.length);

        if (tree) {
          const currentTree = tree;
          const allDocsPromises = projects.map((p: any) => scanProjectDocuments(p.path, currentTree));
          const allDocsLists = await Promise.all(allDocsPromises);
          const allDocs = allDocsLists.flat();

          const stats = computeWorkspaceStats(clients.length, projects.length, allDocs);
          setDocumentsCount(stats.documentsCount);
          setApprovedCount(stats.approvedCount);
          setLockedCount(stats.lockedCount);

          const exportDocs = allDocs.filter((d: any) => d.type === 'export' || d.folder === 'exports');
          if (exportDocs.length > 0) {
            exportDocs.sort((a: any, b: any) => b.file_name.localeCompare(a.file_name));
            setLatestExport(exportDocs[0].file_name);
          } else {
            setLatestExport('ยังไม่มีข้อมูลการส่งออก');
          }
        }

        let profileExists = false;
        let profileParseError = false;
        try {
          const profile = await getCompanyProfile(currentPath);
          profileExists = !!profile;
        } catch {
          profileExists = true;
          profileParseError = true;
        }
        setCompanyProfileStatus(determineCompanyProfileStatus(profileExists, profileParseError));

        const presetsPath = `${currentPath}/.scopeflow/presets.yaml`;
        const presetsExist = await pathExists(presetsPath);
        let presetsParseError = false;
        if (presetsExist) {
          try {
            const presetsContent = await readFileContent(presetsPath);
            YAML.parse(presetsContent);
          } catch {
            presetsParseError = true;
          }
        }
        setPresetsStatus(determinePresetsStatus(presetsExist, presetsParseError));

        if (tree) {
          const issues = await checkWorkspaceHealth(currentPath, tree);
          setHealthIssues(issues);
          setHealthStatus(determineHealthStatusSummary(issues));
        }

        const backupKey = `scopeflow:last_backup:${currentPath}`;
        const localBackup = localStorage.getItem(backupKey);
        if (localBackup) {
          setLastBackup(localBackup);
        } else {
          setLastBackup('ยังไม่ได้สำรองข้อมูล');
        }
      } catch (err) {
        console.error('Failed to load workspace overview:', err);
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaceInfo();
  }, [workspacePath, tree]);

  const handleOpenWorkspaceFolder = async () => {
    if (workspacePath) {
      try {
        await openPath(workspacePath);
      } catch (err) {
        console.error('Failed to open workspace folder:', err);
      }
    }
  };

  const handleFixScopeflowYaml = async () => {
    try {
      if (!workspacePath) return;
      const folderName = workspacePath.split(/[/\\]/).pop() || 'ScopeFlow Workspace';
      const { generateWorkspaceConfig } = await import('../lib/templates');
      const config = generateWorkspaceConfig(folderName);
      const yamlPath = `${workspacePath}/scopeflow.yaml`;
      await writeFileContent(yamlPath, config);
      await refreshTree();
      alert('สร้างไฟล์ scopeflow.yaml และแก้ไขสำเร็จ!');
    } catch (err) {
      alert(`สร้างไฟล์ไม่สำเร็จ: ${err}`);
    }
  };

  const handleCreateDemo = async () => {
    if (!workspacePath) return;
    if (window.confirm("คุณต้องการสร้างข้อมูลตัวอย่าง (Demo Workspace) ในโฟลเดอร์นี้ใช่หรือไม่? การดำเนินการนี้จะเพิ่มข้อมูลลูกค้าโครงการและเอกสารสำหรับทดลองใช้งาน")) {
      try {
        setLoading(true);
        await generateDemoWorkspace(workspacePath, workspaceName);
        await refreshTree();
        alert('สร้าง Demo Workspace สำเร็จ!');
      } catch (err) {
        alert(`สร้าง Demo ไม่สำเร็จ: ${err}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTriggerBackup = () => {
    onBackupWorkspace();
    setTimeout(() => {
      const backupKey = `scopeflow:last_backup:${workspacePath}`;
      const now = new Date().toLocaleString('th-TH');
      localStorage.setItem(backupKey, now);
      setLastBackup(now);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-[#121214] to-[#09090b]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">กำลังโหลดข้อมูล Workspace...</p>
        </div>
      </div>
    );
  }

  const clientsWithProjects = tree?.children || [];

  const Header = (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-text-muted flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-primary-light" />
          ภาพรวม Workspace
        </h1>
        <p className="text-sm text-text-dim mt-2 font-mono truncate max-w-2xl">{workspacePath}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="badge badge-muted font-mono text-xs">เวอร์ชัน: {workspaceVersion}</span>
        {createdDate && <span className="badge badge-muted font-mono text-xs">วันที่สร้าง: {createdDate}</span>}
      </div>
    </div>
  );

  return (
    <PageShell header={Header}>
      {/* Error/Warning Banner */}
      {healthIssues.some(i => i.type === 'error') && (
        <div className="p-5 bg-error/10 border border-error/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-error/15 flex items-center justify-center text-error shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold text-text">พบข้อผิดพลาดร้ายแรงใน Workspace</h4>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {healthIssues.find(i => i.type === 'error')?.message}
              </p>
            </div>
          </div>
          {healthIssues.some(i => i.fixAction === 'create_scopeflow_yaml') && (
            <button
              onClick={handleFixScopeflowYaml}
              className="btn btn-sm text-error bg-error/20 hover:bg-error hover:text-white border border-error/30 transition-all font-semibold shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> สร้างไฟล์สำหรับ Workspace
            </button>
          )}
        </div>
      )}

      <WorkspaceStats 
        clientsCount={clientsCount}
        projectsCount={projectsCount}
        documentsCount={documentsCount}
        approvedCount={approvedCount}
        lockedCount={lockedCount}
        healthStatus={healthStatus}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ClientList 
          clientsWithProjects={clientsWithProjects}
          onCreateClient={onCreateClient}
          onCreateProject={onCreateProject}
          onSelectClient={setSelectedFile}
        />
        <WorkspaceStatus 
          companyProfileStatus={companyProfileStatus}
          presetsStatus={presetsStatus}
          lastBackup={lastBackup}
          latestExport={latestExport}
        />
      </div>

      <MaintenanceActions 
        onCreateClient={onCreateClient}
        onRunHealthCheck={onRunHealthCheck}
        onBackupWorkspace={handleTriggerBackup}
        handleCreateDemo={handleCreateDemo}
        handleOpenWorkspaceFolder={handleOpenWorkspaceFolder}
      />
    </PageShell>
  );
}
