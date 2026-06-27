export interface CloseoutConfirmationFile {
  path: string;
}

function relativeProjectPath(projectPath: string, filePath: string): string {
  const normalizedProjectPath = projectPath.replace(/\\/g, '/');
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  if (normalizedFilePath.startsWith(`${normalizedProjectPath}/`)) {
    return normalizedFilePath.slice(normalizedProjectPath.length + 1);
  }
  return normalizedFilePath;
}

export function buildCloseoutPackConfirmationMessage(projectName: string, projectPath: string, files: CloseoutConfirmationFile[]): string {
  const fileList = files.map(file => `- ${relativeProjectPath(projectPath, file.path)}`).join('\n');
  return `กำลังจะสร้าง Closeout Pack สำหรับ ${projectName}:\n${fileList}\n\nยืนยันหรือไม่?`;
}

export function buildCloseoutExportConfirmationMessage(projectName: string, projectPath: string, filePath: string): string {
  return `กำลังจะสร้าง Closeout Export Index สำหรับ ${projectName}:\n- ${relativeProjectPath(projectPath, filePath)}\n\nยืนยันหรือไม่?`;
}
