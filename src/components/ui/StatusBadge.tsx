import React from 'react';

export type StatusVariant = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'muted';

interface StatusBadgeProps {
  variant?: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

export default function StatusBadge({ variant = 'muted', children, className = '' }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
