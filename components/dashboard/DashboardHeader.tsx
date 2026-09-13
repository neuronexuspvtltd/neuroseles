'use client';

import React from 'react';
import {
  Calendar,
  UserPlus,
  CalendarClock,
  Presentation,
  FileText,
  UserCheck,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  period: string;
  onPeriodChange: (period: string) => void;
  startDate?: string;
  endDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  onAddLeadClick: () => void;
  onScheduleFollowUpClick: () => void;
  onScheduleDemoClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  period,
  onPeriodChange,
  startDate,
  endDate,
  onCustomDateChange,
  onAddLeadClick,
  onScheduleFollowUpClick,
  onScheduleDemoClick,
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl text-white space-y-5 relative overflow-hidden">
      {/* Background Subtle Tech Grid Glow */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-teal-500/10 via-indigo-500/5 to-transparent pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Title & Subtitle */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Next-Gen CRM
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Sales & Pipeline Analytics
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1 max-w-2xl">
            Real-time tracking of lead pipelines, follow-ups, product demos, quotation proposals & client conversions.
          </p>
        </div>

        {/* Global Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs backdrop-blur-md">
            <Filter className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-bold text-slate-300 shrink-0">Period:</span>
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Time (Lifetime)</option>
              <option value="today" className="bg-slate-900 text-white">Today</option>
              <option value="yesterday" className="bg-slate-900 text-white">Yesterday</option>
              <option value="7days" className="bg-slate-900 text-white">Last 7 Days</option>
              <option value="30days" className="bg-slate-900 text-white">Last 30 Days</option>
              <option value="this_month" className="bg-slate-900 text-white">This Month</option>
              <option value="last_month" className="bg-slate-900 text-white">Last Month</option>
              <option value="this_year" className="bg-slate-900 text-white">This Year</option>
              <option value="custom" className="bg-slate-900 text-white">Custom Date Range</option>
            </select>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 p-1.5 rounded-xl text-xs">
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => onCustomDateChange?.(e.target.value, endDate || '')}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px]"
              />
              <span className="text-slate-500 font-bold">-</span>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onCustomDateChange?.(startDate || '', e.target.value)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-[11px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto pb-0.5 relative z-10">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
          Quick Actions:
        </span>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onAddLeadClick}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Lead
          </button>
          <button
            onClick={onScheduleFollowUpClick}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarClock className="w-3.5 h-3.5 text-amber-400" /> Follow-up
          </button>
          <button
            onClick={onScheduleDemoClick}
            className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900/80 text-purple-200 border border-purple-800/60 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Presentation className="w-3.5 h-3.5 text-purple-400" /> Schedule Demo
          </button>
          <Link
            href="/quotations/new"
            className="px-3.5 py-2 bg-teal-950/80 hover:bg-teal-900/80 text-teal-200 border border-teal-800/60 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" /> Create Quote
          </Link>
          <Link
            href="/clients"
            className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/60 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Clients
          </Link>
        </div>
      </div>
    </div>
  );
};
