import React from 'react';
import { STATUS_MAP, LeadStatus } from '@/lib/statusConfig';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const meta = STATUS_MAP[status as LeadStatus] || {
    label: status,
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-700',
    badgeBorder: 'border-gray-200',
    dotColor: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
      {meta.label}
    </span>
  );
};
