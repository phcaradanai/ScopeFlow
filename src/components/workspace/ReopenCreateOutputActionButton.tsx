import ReopenCreateOutputButton from './ReopenCreateOutputButton';
import { getCloseoutReopenCreateOutputAction } from '../../lib/ai/closeout/closeoutReopenCreateOutputAction';
import { executeCloseoutReopenCreateOutputAction } from '../../lib/ai/closeout/closeoutReopenCreateOutputExecutor';
import type { CloseoutLatestReopenDecisionSummary } from '../../lib/ai/closeout/closeoutReopenDecisionDetection';

interface ReopenCreateOutputActionButtonProps {
  projectName: string;
  projectPath: string;
  decision: CloseoutLatestReopenDecisionSummary;
  createDocument: (path: string, markdown: string) => Promise<void>;
  pathExists: (path: string) => Promise<boolean>;
  onSelectFile: (path: string) => void;
  onCompleted?: (path: string) => void;
}

export default function ReopenCreateOutputActionButton({
  projectName,
  projectPath,
  decision,
  createDocument,
  pathExists,
  onSelectFile,
  onCompleted,
}: ReopenCreateOutputActionButtonProps) {
  const action = getCloseoutReopenCreateOutputAction({
    project_name: projectName,
    project_path: projectPath,
    decision,
  });

  const handleCreate = async () => {
    const result = await executeCloseoutReopenCreateOutputAction(action, createDocument, pathExists);
    if (result.path) {
      onSelectFile(result.path);
      if (result.created) onCompleted?.(result.path);
    }
    if (!result.path) {
      alert(result.reason);
    }
  };

  return <ReopenCreateOutputButton action={action} onCreate={handleCreate} />;
}
