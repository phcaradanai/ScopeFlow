import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  iconColorClass?: string;
  iconBgClass?: string;
  valueColorClass?: string;
}

export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  iconColorClass = "text-primary-light", 
  iconBgClass = "bg-primary/10 border-primary/20",
  valueColorClass = "text-text"
}: StatCardProps) {
  return (
    <div className="card flex items-center gap-4.5 !p-5">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${iconBgClass}`}>
        <Icon className={`w-6 h-6 ${iconColorClass}`} />
      </div>
      <div>
        <p className="text-xs text-text-dim font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${valueColorClass}`}>{value}</p>
      </div>
    </div>
  );
}
