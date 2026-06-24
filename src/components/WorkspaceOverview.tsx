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
import {
  FolderOpen,
  Users,
  Briefcase,
  FileText,
  Plus,
  Play,
  ShieldCheck,
  Download,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

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
        // Read scopeflow.yaml
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

        // Get project paths from tree using modular scanner helper
        const projects = getProjectPaths(tree);
        const clients = tree?.children || [];
        setClientsCount(clients.length);
        setProjectsCount(projects.length);

        // Scan all documents in all projects
        if (tree) {
          const currentTree = tree;
          const allDocsPromises = projects.map(p => scanProjectDocuments(p.path, currentTree));
          const allDocsLists = await Promise.all(allDocsPromises);
          const allDocs = allDocsLists.flat();

          const stats = computeWorkspaceStats(clients.length, projects.length, allDocs);
          setDocumentsCount(stats.documentsCount);
          setApprovedCount(stats.approvedCount);
          setLockedCount(stats.lockedCount);

          // Find latest export document
          const exportDocs = allDocs.filter(d => d.type === 'export' || d.folder === 'exports');
          if (exportDocs.length > 0) {
            exportDocs.sort((a, b) => b.file_name.localeCompare(a.file_name));
            setLatestExport(exportDocs[0].file_name);
          } else {
            setLatestExport('ยังไม่มีข้อมูลการส่งออก');
          }
        }

        // Company Profile Status using modular scanner helper
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

        // Presets Status using modular scanner helper
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

        // Health Status Summary using modular scanner helper
        if (tree) {
          const issues = await checkWorkspaceHealth(currentPath, tree);
          setHealthIssues(issues);
          setHealthStatus(determineHealthStatusSummary(issues));
        }

        // Load Backup Date
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
    // Update local storage date
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

  // Group projects by client
  const clientsWithProjects = tree?.children || [];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#121214] to-[#09090b] overflow-y-auto">
      <div className="max-w-[1080px] mx-auto w-full px-8 py-10 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="card flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-dim font-bold uppercase tracking-wider">ลูกค้าทั้งหมด</p>
              <p className="text-2xl font-bold mt-1">{clientsCount} ราย</p>
            </div>
          </div>

          <div className="card flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-primary-light" />
            </div>
            <div>
              <p className="text-xs text-text-dim font-bold uppercase tracking-wider">โครงการทั้งหมด</p>
              <p className="text-2xl font-bold mt-1">{projectsCount} โครงการ</p>
            </div>
          </div>

          <div className="card flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xs text-text-dim font-bold uppercase tracking-wider">เอกสารทั้งหมด</p>
              <p className="text-2xl font-bold mt-1 flex items-baseline gap-2">
                {documentsCount}
                <span className="text-xs font-normal text-text-dim">
                  ({approvedCount} อนุมัติ / {lockedCount} ล็อก)
                </span>
              </p>
            </div>
          </div>

          <div className="card flex items-center gap-4.5">
            <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-xs text-text-dim font-bold uppercase tracking-wider">สุขภาพ Workspace</p>
              <p className={`text-2xl font-bold mt-1 ${
                healthStatus === 'OK' ? 'text-success' : healthStatus === 'Warning' ? 'text-warning' : 'text-error'
              }`}>{healthStatus}</p>
            </div>
          </div>
        </div>

        {/* Clients and Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clients List */}
          <div className="card lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                ลูกค้าใน Workspace
              </h3>
              <button onClick={onCreateClient} className="btn btn-ghost btn-sm">
                <Plus className="w-3.5 h-3.5" /> เพิ่มลูกค้า
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {clientsWithProjects.length === 0 ? (
                <div className="text-center py-8 text-text-dim">
                  <p>ยังไม่มีข้อมูลลูกค้า</p>
                  <button onClick={onCreateClient} className="text-xs text-primary-light hover:underline mt-2">
                    สร้างลูกค้ารายแรก
                  </button>
                </div>
              ) : (
                clientsWithProjects.map(client => {
                  const clientProjCount = client.children?.find(c => c.name === 'projects')?.children?.length || 0;
                  const clientId = client.path.split('/').pop() || client.name;
                  return (
                    <div key={client.path} className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border hover:border-white/10 transition-colors">
                      <button
                        onClick={() => setSelectedFile(`__client__:${clientId}`)}
                        className="font-semibold text-sm text-text hover:text-primary-light text-left truncate flex-1 hover:underline"
                      >
                        {client.name}
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="badge badge-muted text-xs">{clientProjCount} โครงการ</span>
                        <button
                          onClick={() => onCreateProject(clientId)}
                          className="btn btn-ghost btn-icon"
                          title="สร้างโครงการใหม่"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Status Panel */}
          <div className="card flex flex-col gap-4">
            <h3 className="text-base font-bold text-text border-b border-white/5 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-light" />
              สถานะข้อมูล
            </h3>

            <div className="space-y-4 text-sm flex-1">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">ข้อมูลบริษัท:</span>
                <span className={`badge ${
                  companyProfileStatus === 'configured' ? 'badge-success' : companyProfileStatus === 'missing' ? 'badge-warning' : 'badge-error'
                }`}>
                  {companyProfileStatus === 'configured' ? 'ตั้งค่าแล้ว' : companyProfileStatus === 'missing' ? 'ไม่มี' : 'ข้อมูลผิดพลาด'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-muted">เทมเพลตและพรีเซต:</span>
                <span className={`badge ${
                  presetsStatus === 'configured' ? 'badge-success' : presetsStatus === 'missing' ? 'badge-warning' : 'badge-error'
                }`}>
                  {presetsStatus === 'configured' ? 'ตั้งค่าแล้ว' : presetsStatus === 'missing' ? 'ไม่มี' : 'ข้อมูลผิดพลาด'}
                </span>
              </div>

              <div className="border-t border-white/5 pt-3 space-y-2">
                <div>
                  <p className="text-xs text-text-dim uppercase tracking-wider">สำรองข้อมูลล่าสุด</p>
                  <p className="text-xs font-semibold text-text-muted mt-1 font-mono truncate">{lastBackup}</p>
                </div>
                <div>
                  <p className="text-xs text-text-dim uppercase tracking-wider">ไฟล์ส่งออกล่าสุด</p>
                  <p className="text-xs font-semibold text-text-muted mt-1 font-mono truncate">{latestExport}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operations & Maintenance */}
        <div className="card flex flex-col gap-4">
          <h3 className="text-base font-bold text-text border-b border-white/5 pb-3">
            การดูแล Workspace
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              onClick={onCreateClient}
              className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]"
            >
              <Plus className="w-5 h-5 text-accent" />
              <span className="text-xs font-bold">สร้างลูกค้าใหม่</span>
            </button>

            <button
              onClick={handleCreateDemo}
              className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]"
            >
              <Play className="w-5 h-5 text-primary-light" />
              <span className="text-xs font-bold">สร้าง Demo</span>
            </button>

            <button
              onClick={onRunHealthCheck}
              className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]"
            >
              <ShieldCheck className="w-5 h-5 text-warning" />
              <span className="text-xs font-bold">ตรวจสอบ Workspace</span>
            </button>

            <button
              onClick={handleTriggerBackup}
              className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]"
            >
              <Download className="w-5 h-5 text-success" />
              <span className="text-xs font-bold">สำรอง Workspace</span>
            </button>

            <button
              onClick={handleOpenWorkspaceFolder}
              className="btn btn-ghost hover:bg-primary/5 hover:border-primary/20 flex flex-col items-center justify-center p-5 gap-2 text-center rounded-xl min-h-[100px]"
            >
              <ExternalLink className="w-5 h-5 text-text-muted" />
              <span className="text-xs font-bold">เปิดโฟลเดอร์</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
