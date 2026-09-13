'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  UserPlus,
  PhoneCall,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
  Tag,
  Trophy,
  FileEdit,
  Activity as ActivityIcon,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
}

interface LeadTimelineProps {
  activities: ActivityItem[];
}

export const LeadTimeline: React.FC<LeadTimelineProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        No activity history recorded yet.
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'LEAD_CREATED':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'CALL_MADE':
        return <PhoneCall className="w-4 h-4 text-indigo-600" />;
      case 'FOLLOW_UP_SCHEDULED':
        return <CalendarClock className="w-4 h-4 text-amber-600" />;
      case 'FOLLOW_UP_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'FOLLOW_UP_RESCHEDULED':
        return <RefreshCw className="w-4 h-4 text-purple-600" />;
      case 'STATUS_CHANGED':
        return <Tag className="w-4 h-4 text-slate-600" />;
      case 'CONVERTED':
        return <Trophy className="w-4 h-4 text-emerald-600" />;
      case 'REQUIREMENTS_UPDATED':
        return <FileEdit className="w-4 h-4 text-cyan-600" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {activities.map((item) => {
        const dateObj = parseISO(item.createdAt);
        const formattedDate = format(dateObj, 'dd MMM yyyy, hh:mm a');

        return (
          <div key={item.id} className="relative group">
            {/* Dot/Icon */}
            <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center -translate-x-1/2">
              {getIcon(item.activityType)}
            </div>

            {/* Event Box */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-slate-800">
                  {item.description}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
