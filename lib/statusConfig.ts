export type LeadStatus =
  | 'NEW'
  | 'CALLED'
  | 'UNREACHABLE'
  | 'INTERESTED'
  | 'FOLLOW_UP'
  | 'DEMO'
  | 'QUOTATION'
  | 'NOT_INTERESTED'
  | 'CONVERTED';

export interface StatusMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export const STATUS_MAP: Record<LeadStatus, StatusMeta> = {
  NEW: {
    label: 'New',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  CALLED: {
    label: 'Called',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    dotColor: 'bg-slate-500',
  },
  UNREACHABLE: {
    label: 'Unreachable / Retry',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  INTERESTED: {
    label: 'Interested',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    dotColor: 'bg-indigo-500',
  },
  FOLLOW_UP: {
    label: 'Follow-up',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  DEMO: {
    label: 'Demo',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    dotColor: 'bg-purple-500',
  },
  QUOTATION: {
    label: 'Quotation',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-200',
    dotColor: 'bg-cyan-500',
  },
  NOT_INTERESTED: {
    label: 'Not Interested',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-500',
  },
  CONVERTED: {
    label: 'Converted',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
};

export const CUSTOMER_RESPONSE_STATUS_MAP: Record<string, LeadStatus> = {
  'Interested': 'INTERESTED',
  'Demo Required': 'DEMO',
  'Quotation Required': 'QUOTATION',
  'Call Later': 'FOLLOW_UP',
  'Not Interested': 'NOT_INTERESTED',
  'Converted': 'CONVERTED',
};
