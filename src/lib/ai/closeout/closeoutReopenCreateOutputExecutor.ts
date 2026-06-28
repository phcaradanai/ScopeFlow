import type { CloseoutReopenCreateOutputAction } from './closeoutReopenCreateOutputAction';

export interface CloseoutReopenCreateOutputExecutorResult {
  created: boolean;
  path?: string;
  reason: string;
}

export async function executeCloseoutReopenCreateOutputAction(
  action: CloseoutReopenCreateOutputAction,
  createDocument: (path: string, markdown: string) => Promise<void>,
  pathExists: (path: string) => Promise<boolean>
): Promise<CloseoutReopenCreateOutputExecutorResult> {
  if (!action.enabled || !action.output?.path || !action.output.markdown) {
    return {
      created: false,
      reason: action.reason,
    };
  }

  if (await pathExists(action.output.path)) {
    return {
      created: false,
      path: action.output.path,
      reason: `Output artifact already exists: ${action.output.path}`,
    };
  }

  await createDocument(action.output.path, action.output.markdown);
  return {
    created: true,
    path: action.output.path,
    reason: `Created output artifact: ${action.output.path}`,
  };
}
