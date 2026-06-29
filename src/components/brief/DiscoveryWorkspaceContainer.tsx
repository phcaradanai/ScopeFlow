import { useMemo, useState } from 'react';
import DiscoveryWorkspace from './DiscoveryWorkspace';
import { answerDiscoveryQuestion, createDiscoverySession, type DiscoverySession } from '../../lib/ai/brief-assistant/discoverySession';
import type { ScopeDigestOutput } from '../../lib/ai/scope-digest/scopeDigestSchema';

interface DiscoveryWorkspaceContainerProps {
  clientId: string;
  projectId?: string;
  projectType?: string;
  rawRequest: string;
  digest?: ScopeDigestOutput;
  onGenerateBrief?: (session: DiscoverySession) => void;
  onGenerateScope?: (session: DiscoverySession) => void;
  onGenerateQuotation?: (session: DiscoverySession) => void;
}

export default function DiscoveryWorkspaceContainer({
  clientId,
  projectId,
  projectType = 'อื่น ๆ',
  rawRequest,
  digest,
  onGenerateBrief,
  onGenerateScope,
  onGenerateQuotation,
}: DiscoveryWorkspaceContainerProps) {
  const initialSession = useMemo(() => createDiscoverySession({
    clientId,
    projectId,
    projectType,
    rawRequest,
    digest,
  }), [clientId, projectId, projectType, rawRequest, digest]);

  const [session, setSession] = useState(initialSession);
  const [answerDraft, setAnswerDraft] = useState('');

  const handleSubmitAnswer = () => {
    const trimmed = answerDraft.trim();
    if (!trimmed) return;
    setSession(current => answerDiscoveryQuestion(current, trimmed));
    setAnswerDraft('');
  };

  return (
    <DiscoveryWorkspace
      session={session}
      answerDraft={answerDraft}
      onAnswerDraftChange={setAnswerDraft}
      onSubmitAnswer={handleSubmitAnswer}
      onGenerateBrief={() => onGenerateBrief?.(session)}
      onGenerateScope={() => onGenerateScope?.(session)}
      onGenerateQuotation={() => onGenerateQuotation?.(session)}
    />
  );
}
