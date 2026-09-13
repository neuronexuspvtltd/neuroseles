import React from 'react';
import { STATUS_MAP, LeadStatus } from '@/lib/statusConfig';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showPulse = true }) => {
  const meta = STATUS_MAP[status as LeadStatus] || {
    label: status,
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200/80',
    dotColor: 'bg-slate-400',
  };

  const isAnimated = showPulse && (status === 'NEW' || status === 'INTERESTED' || status === 'DEMO' || status === 'CONVERTED');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs transition-all ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ${className}`}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {isAnimated && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${meta.dotColor}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${meta.dotColor}`} />
      </span>
      <span>{meta.label}</span>
    </span>
  );
};
