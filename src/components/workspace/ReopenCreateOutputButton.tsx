import { FileOutput } from 'lucide-react';
import type { CloseoutReopenCreateOutputAction } from '../../lib/ai/closeout/closeoutReopenCreateOutputAction';

interface ReopenCreateOutputButtonProps {
  action: CloseoutReopenCreateOutputAction;
  onCreate: () => void;
}

export default function ReopenCreateOutputButton({ action, onCreate }: ReopenCreateOutputButtonProps) {
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={!action.enabled}
      title={action.reason}
      className="btn btn-outline text-xs gap-2 shrink-0 disabled:opacity-50"
    >
      <FileOutput className="w-3.5 h-3.5" /> {action.label}
    </button>
  );
}
