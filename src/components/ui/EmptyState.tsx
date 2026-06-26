import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  iconColorClass?: string;
  iconBgClass?: string;
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  primaryAction, 
  secondaryAction,
  iconColorClass = "text-primary-light",
  iconBgClass = "bg-primary/10 border-primary/20"
}: EmptyStateProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="card max-w-lg w-full mx-6 py-12 px-8 text-center flex flex-col items-center bg-surface-2/80">
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-6 ${iconBgClass}`}>
          <Icon className={`w-8 h-8 ${iconColorClass}`} />
        </div>
        <h2 className="text-xl font-bold text-text mb-3 whitespace-normal break-words leading-relaxed">{title}</h2>
        <p className="text-sm text-text-dim mb-8 max-w-md leading-relaxed">{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            {secondaryAction && (
              <button onClick={secondaryAction.onClick} className="btn btn-ghost w-full sm:w-auto">
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button onClick={primaryAction.onClick} className="btn btn-primary w-full sm:w-auto">
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
