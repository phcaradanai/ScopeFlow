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
  iconColorClass = 'text-primary-light',
  iconBgClass = 'bg-primary/10 border-primary/20',
}: EmptyStateProps) {
  return (
    <div className="empty-state-screen">
      <section className="empty-state-card" aria-label={title}>
        <div className={`empty-state-icon border ${iconBgClass}`}>
          <Icon className={`w-8 h-8 ${iconColorClass}`} aria-hidden="true" />
        </div>
        <h2 className="empty-state-title">{title}</h2>
        <p className="empty-state-description">{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className="empty-state-actions">
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
      </section>
    </div>
  );
}
