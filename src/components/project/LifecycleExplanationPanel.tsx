import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { LifecycleExplanation, LifecycleExplanationItem } from '../../lib/ai/document-lifecycle/lifecycleExplanation';

interface LifecycleExplanationPanelProps {
  explanation: LifecycleExplanation;
  onOpenDocument: (path: string) => void;
}

function ExplanationChip({ item, type, onOpenDocument }: { item: LifecycleExplanationItem; type: 'success' | 'warning'; onOpenDocument: (path: string) => void }) {
  const baseClasses = `px-2 py-0.5 rounded-full text-[11px] border flex items-center gap-1`;
  const typeClasses = type === 'success' 
    ? 'bg-success/10 text-success border-success/20' 
    : 'bg-warning/10 text-warning border-warning/20';

  if (item.sourcePath) {
    const hoverClasses = type === 'success' ? 'hover:bg-success/20' : 'hover:bg-warning/20';
    return (
      <button
        type="button"
        onClick={() => onOpenDocument(item.sourcePath!)}
        className={`${baseClasses} ${typeClasses} ${hoverClasses} transition-colors cursor-pointer`}
        title={item.actionLabel}
      >
        <FileText className="w-3 h-3" />
        {item.label}
      </button>
    );
  }

  return (
    <span className={`${baseClasses} ${typeClasses}`}>
      {item.label}
    </span>
  );
}

export default function LifecycleExplanationPanel({ explanation, onOpenDocument }: LifecycleExplanationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-surface mb-3 text-[13px]">
      <button 
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2.5 bg-surface-2 hover:bg-surface-3 transition-colors text-text-muted font-medium"
      >
        <div className="flex items-center gap-2">
          <span className="text-primary">Why this action?</span>
          <span className="text-text-dim truncate max-w-[200px] md:max-w-md">{explanation.headline}</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isExpanded && (
        <div className="p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {explanation.evidence.length > 0 && (
            <div>
              <h5 className="font-bold text-text-muted mb-1 text-[11px] uppercase tracking-wider">Evidence</h5>
              <div className="flex flex-wrap gap-1.5">
                {explanation.evidence.map((e, i) => (
                  <ExplanationChip key={i} item={e} type="success" onOpenDocument={onOpenDocument} />
                ))}
              </div>
            </div>
          )}
          
          {explanation.missingDocuments.length > 0 && (
            <div>
              <h5 className="font-bold text-text-muted mb-1 text-[11px] uppercase tracking-wider">Missing</h5>
              <div className="flex flex-wrap gap-1.5">
                {explanation.missingDocuments.map((e, i) => (
                  <ExplanationChip key={i} item={e} type="warning" onOpenDocument={onOpenDocument} />
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {explanation.riskIfIgnored && (
              <div className="bg-error/5 border border-error/10 p-2.5 rounded-md">
                <h5 className="font-bold text-error mb-1 text-[11px] uppercase tracking-wider">Risk If Ignored</h5>
                <p className="text-text-muted leading-relaxed">{explanation.riskIfIgnored.label}</p>
              </div>
            )}
            {explanation.expectedNextState && (
              <div className="bg-primary/5 border border-primary/10 p-2.5 rounded-md">
                <h5 className="font-bold text-primary mb-1 text-[11px] uppercase tracking-wider">Expected Outcome</h5>
                <p className="text-text-muted leading-relaxed">{explanation.expectedNextState.label}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
