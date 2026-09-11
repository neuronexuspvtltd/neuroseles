'use client';

import React from 'react';
import {
  Users,
  CalendarClock,
  Presentation,
  FileText,
  Trophy,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface KPICardGridProps {
  summary: {
    totalLeads: number;
    totalLeadsGrowth: number;
    newLeads: number;
    calledLeads: number;
    interestedLeads: number;
    followUpLeads: number;
    demoLeads: number;
    quotationLeads: number;
    convertedClients: number;
    pendingFollowUps: number;
    todayFollowUpsCount: number;
    overdueFollowUpsCount: number;
    upcomingDemosCount: number;
    todayDemosCount: number;
    completedDemosCount: number;
    totalQuotations: number;
    draftQuotations: number;
    sentQuotations: number;
    acceptedQuotations: number;
    totalQuotationValue: number;
    acceptedQuotationValue: number;
    quotationAcceptanceRate: number;
    totalClients: number;
    activeClients: number;
    convertedThisMonth: number;
    overallConversionRate: number;
  };
  loading?: boolean;
}

export const KPICardGrid: React.FC<KPICardGridProps> = ({ summary, loading = false }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Card 1: Total Leads */}
      <Link
        href="/leads"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leads Overview</span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {loading ? '-' : summary.totalLeads}
            </span>
            {summary.totalLeadsGrowth !== 0 && (
              <span className={`text-xs font-bold inline-flex items-center gap-0.5 ${summary.totalLeadsGrowth > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                <TrendingUp className="w-3 h-3" />
                {summary.totalLeadsGrowth > 0 ? `+${summary.totalLeadsGrowth}%` : `${summary.totalLeadsGrowth}%`}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Total Leads In Database</span>
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-[10px] text-slate-600">
          <div className="bg-slate-50 p-1.5 rounded-lg text-center">
            <span className="block font-bold text-slate-900">{loading ? '-' : summary.newLeads}</span>
            <span className="text-slate-400">New</span>
          </div>
          <div className="bg-slate-50 p-1.5 rounded-lg text-center">
            <span className="block font-bold text-slate-900">{loading ? '-' : summary.calledLeads}</span>
            <span className="text-slate-400">Called</span>
          </div>
          <div className="bg-emerald-50 p-1.5 rounded-lg text-center text-emerald-800">
            <span className="block font-black">{loading ? '-' : summary.convertedClients}</span>
            <span>Client</span>
          </div>
        </div>
      </Link>

      {/* Card 2: Follow-ups */}
      <Link
        href="/follow-ups"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Follow-ups</span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <CalendarClock className="w-4 h-4" />
          </div>
        </div>

        <div>
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {loading ? '-' : summary.pendingFollowUps}
          </span>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Total Pending Tasks</span>
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-indigo-50/70 p-1.5 rounded-lg text-indigo-900 font-medium text-center">
            <span className="block font-bold text-xs">{loading ? '-' : summary.todayFollowUpsCount}</span>
            <span>Today's</span>
          </div>
          <div className={`p-1.5 rounded-lg text-center font-medium ${summary.overdueFollowUpsCount > 0 ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-slate-50 text-slate-600'}`}>
            <span className="block font-bold text-xs">{loading ? '-' : summary.overdueFollowUpsCount}</span>
            <span>Overdue</span>
          </div>
        </div>
      </Link>

      {/* Card 3: Demos */}
      <Link
        href="/demos"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Demos</span>
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Presentation className="w-4 h-4" />
          </div>
        </div>

        <div>
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {loading ? '-' : summary.upcomingDemosCount}
          </span>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Upcoming Demos</span>
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-purple-50 p-1.5 rounded-lg text-purple-900 font-medium text-center">
            <span className="block font-bold text-xs">{loading ? '-' : summary.todayDemosCount}</span>
            <span>Today's</span>
          </div>
          <div className="bg-slate-50 p-1.5 rounded-lg text-slate-700 font-medium text-center">
            <span className="block font-bold text-xs">{loading ? '-' : summary.completedDemosCount}</span>
            <span>Done</span>
          </div>
        </div>
      </Link>

      {/* Card 4: Quotations */}
      <Link
        href="/quotations"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between group space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quotations</span>
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {loading ? '-' : summary.totalQuotations}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              {loading ? '-' : `${summary.quotationAcceptanceRate}% Rate`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Proposals & Quotes</span>
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-[10px]">
          <div className="bg-slate-50 p-1.5 rounded-lg text-center">
            <span className="block font-bold text-slate-800">{loading ? '-' : summary.draftQuotations}</span>
            <span className="text-slate-400">Draft</span>
          </div>
          <div className="bg-indigo-50 p-1.5 rounded-lg text-center text-indigo-800">
            <span className="block font-bold">{loading ? '-' : summary.sentQuotations}</span>
            <span>Sent</span>
          </div>
          <div className="bg-emerald-50 p-1.5 rounded-lg text-center text-emerald-800">
            <span className="block font-black">{loading ? '-' : summary.acceptedQuotations}</span>
            <span>Accepted</span>
          </div>
        </div>
      </Link>

      {/* Card 5: Clients */}
      <Link
        href="/clients"
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clients</span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Trophy className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {loading ? '-' : summary.totalClients}
            </span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {loading ? '-' : `${summary.overallConversionRate}% Conv.`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Converted Clients</span>
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-900 font-medium text-center">
            <span className="block font-bold text-xs">{loading ? '-' : summary.activeClients}</span>
            <span>Active</span>
          </div>
          <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-900 font-medium text-center">
            <span className="block font-bold text-xs">{loading ? '-' : summary.convertedThisMonth}</span>
            <span>This Month</span>
          </div>
        </div>
      </Link>
    </div>
  );
};
