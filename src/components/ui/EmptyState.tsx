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
    <div className="h-full flex items-center justify-center bg-gradient-to-b from-[#121214] to-[#09090b]">
      <div className="max-w-md w-full mx-auto px-6 text-center flex flex-col items-center">
        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-6 ${iconBgClass}`}>
          <Icon className={`w-8 h-8 ${iconColorClass}`} />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">{title}</h2>
        <p className="text-sm text-text-dim mb-8">{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className="flex gap-4 w-full justify-center">
            {secondaryAction && (
              <button onClick={secondaryAction.onClick} className="btn btn-ghost">
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button onClick={primaryAction.onClick} className="btn btn-primary">
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
