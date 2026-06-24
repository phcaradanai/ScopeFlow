import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getWorkspaceTree, openWorkspace } from './tauri-commands';
import type { FileEntry } from './tauri-commands';

interface WorkspaceContextType {
  workspacePath: string | null;
  workspaceName: string;
  tree: FileEntry | null;
  selectedFile: string | null;
  setWorkspacePath: (path: string) => void;
  setSelectedFile: (path: string | null) => void;
  refreshTree: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspacePath, setWorkspacePathState] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string>('ScopeFlow Thai');
  const [tree, setTree] = useState<FileEntry | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const refreshTree = useCallback(async () => {
    if (!workspacePath) return;
    try {
      const t = await getWorkspaceTree(workspacePath);
      setTree(t);
      if (t.name) setWorkspaceName(t.name);
    } catch (err) {
      console.error('Failed to refresh tree:', err);
    }
  }, [workspacePath]);

  const setWorkspacePath = useCallback(async (path: string) => {
    setWorkspacePathState(path);
    try {
      const configYaml = await openWorkspace(path);
      // Extract workspace name from YAML
      const nameMatch = configYaml.match(/name:\s*"?([^"\n]+)"?/);
      if (nameMatch) setWorkspaceName(nameMatch[1].trim());
    } catch {
      // New workspace or no config yet
    }
  }, []);

  useEffect(() => {
    if (workspacePath) {
      refreshTree();
    }
  }, [workspacePath, refreshTree]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspacePath,
        workspaceName,
        tree,
        selectedFile,
        setWorkspacePath,
        setSelectedFile,
        refreshTree,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
