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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            CRM Operations & Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time pipeline performance, lead generation, quotations & client conversion overview
          </p>
        </div>

        {/* Global Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-600 shrink-0">Period:</span>
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Time (Lifetime)</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs">
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => onCustomDateChange?.(e.target.value, endDate || '')}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px]"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onCustomDateChange?.(startDate || '', e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Quick Actions:
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onAddLeadClick}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-all inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" /> + Add Lead
          </button>
          <button
            onClick={onScheduleFollowUpClick}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
          >
            <CalendarClock className="w-3.5 h-3.5 text-indigo-600" /> + Follow-up
          </button>
          <button
            onClick={onScheduleDemoClick}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
          >
            <Presentation className="w-3.5 h-3.5 text-purple-600" /> + Schedule Demo
          </button>
          <Link
            href="/quotations/new"
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" /> + Create Quotation
          </Link>
          <Link
            href="/clients"
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> View Clients
          </Link>
        </div>
      </div>
    </div>
  );
};
