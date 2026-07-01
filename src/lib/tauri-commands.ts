// Tauri command wrappers for the React frontend
// All file I/O goes through these functions → Tauri → Rust → filesystem

import { invoke } from '@tauri-apps/api/core';

// ─── Types from Rust ────────────────────────────────────────────

export interface ClientSummary {
  id: string;
  name: string;
  contact_person: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  project_type: string;
  status: string;
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileEntry[];
}

export interface DocumentInfo {
  path: string;
  filename: string;
  folder: string;
}

// ─── Workspace ──────────────────────────────────────────────────

export async function createWorkspace(
  path: string,
  name: string,
  configContent: string
): Promise<void> {
  return invoke('create_workspace', {
    path,
    name,
    configContent,
  });
}

export async function openWorkspace(path: string): Promise<string> {
  return invoke('open_workspace', { path });
}

export async function readFileContent(path: string): Promise<string> {
  return invoke('read_file_content', { path });
}

export async function writeFileContent(
  path: string,
  content: string
): Promise<void> {
  return invoke('write_file_content', { path, content });
}

export async function updateFileContent(
  path: string,
  content: string
): Promise<void> {
  return invoke('update_file_content', { path, content });
}

export async function deleteFile(path: string): Promise<void> {
  return invoke('delete_file', { path });
}

export async function replaceFileContent(
  path: string,
  content: string
): Promise<void> {
  await deleteFile(path);
  await writeFileContent(path, content);
}

export async function pathExists(path: string): Promise<boolean> {
  return invoke('path_exists', { path });
}

// ─── Clients ────────────────────────────────────────────────────

export async function createClient(
  workspacePath: string,
  clientId: string,
  clientYaml: string
): Promise<void> {
  return invoke('create_client', {
    workspacePath,
    clientId,
    clientYaml,
  });
}

export async function listClients(
  workspacePath: string
): Promise<ClientSummary[]> {
  return invoke('list_clients', { workspacePath });
}

// ─── Projects ───────────────────────────────────────────────────

export async function createProject(
  workspacePath: string,
  clientId: string,
  projectId: string,
  projectYaml: string,
  projectType: string,
  currentSystemFiles?: [string, string][]
): Promise<void> {
  return invoke('create_project', {
    workspacePath,
    clientId,
    projectId,
    projectYaml,
    projectType,
    currentSystemFiles: currentSystemFiles || null,
  });
}

export async function listProjects(
  workspacePath: string,
  clientId: string
): Promise<ProjectSummary[]> {
  return invoke('list_projects', { workspacePath, clientId });
}

// ─── Documents ──────────────────────────────────────────────────

export async function createDocument(
  path: string,
  content: string
): Promise<void> {
  return invoke('create_document', { path, content });
}

export async function listProjectDocuments(
  workspacePath: string,
  clientId: string,
  projectId: string
): Promise<DocumentInfo[]> {
  return invoke('list_project_documents', {
    workspacePath,
    clientId,
    projectId,
  });
}

// ─── Sidebar Tree ───────────────────────────────────────────────

export async function getWorkspaceTree(
  workspacePath: string
): Promise<FileEntry> {
  return invoke('get_workspace_tree', { workspacePath });
}

export async function copyEvidenceFiles(
  sourcePaths: string[],
  targetDir: string
): Promise<string[]> {
  return invoke('copy_evidence_files', { sourcePaths, targetDir });
}

export async function backupWorkspace(workspacePath: string, destZipPath: string): Promise<void> {
  return invoke('backup_workspace', { workspacePath, destZipPath });
}

export async function restoreWorkspace(zipPath: string, destDirPath: string, forceOverwrite: boolean = false): Promise<void> {
  return invoke('restore_workspace', { zipPath, destDirPath, forceOverwrite });
}
