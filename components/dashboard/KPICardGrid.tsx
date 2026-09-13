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
        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-500/30 transition-all duration-200 flex flex-col justify-between group space-y-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-teal-500 before:to-indigo-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Leads Overview</span>
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {loading ? '-' : summary.totalLeads}
            </span>
            {summary.totalLeadsGrowth !== 0 && (
              <span className={`text-xs font-bold inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${summary.totalLeadsGrowth > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                <TrendingUp className="w-3 h-3" />
                {summary.totalLeadsGrowth > 0 ? `+${summary.totalLeadsGrowth}%` : `${summary.totalLeadsGrowth}%`}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Total Leads In Database</span>
        </div>

        <div className="pt-3 border-t border-slate-100/80 grid grid-cols-3 gap-1.5 text-[10px] text-slate-600">
          <div className="bg-slate-50 p-1.5 rounded-xl text-center">
            <span className="block font-black text-slate-900 text-xs">{loading ? '-' : summary.newLeads}</span>
            <span className="text-slate-400 font-semibold">New</span>
          </div>
          <div className="bg-slate-50 p-1.5 rounded-xl text-center">
            <span className="block font-black text-slate-900 text-xs">{loading ? '-' : summary.calledLeads}</span>
            <span className="text-slate-400 font-semibold">Called</span>
          </div>
          <div className="bg-emerald-50/80 p-1.5 rounded-xl text-center text-emerald-800">
            <span className="block font-black text-xs">{loading ? '-' : summary.convertedClients}</span>
            <span className="font-semibold">Client</span>
          </div>
        </div>
      </Link>

      {/* Card 2: Follow-ups */}
      <Link
        href="/follow-ups"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-500/30 transition-all duration-200 flex flex-col justify-between group space-y-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-amber-500 before:to-orange-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Follow-ups</span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
            <CalendarClock className="w-4 h-4" />
          </div>
        </div>

        <div>
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {loading ? '-' : summary.pendingFollowUps}
          </span>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Total Pending Tasks</span>
        </div>

        <div className="pt-3 border-t border-slate-100/80 grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-indigo-50/70 p-1.5 rounded-xl text-indigo-900 font-medium text-center">
            <span className="block font-black text-xs">{loading ? '-' : summary.todayFollowUpsCount}</span>
            <span className="font-semibold">Today's</span>
          </div>
          <div className={`p-1.5 rounded-xl text-center font-medium ${summary.overdueFollowUpsCount > 0 ? 'bg-rose-50 text-rose-800 border border-rose-200/60 font-bold' : 'bg-slate-50 text-slate-600'}`}>
            <span className="block font-black text-xs">{loading ? '-' : summary.overdueFollowUpsCount}</span>
            <span className="font-semibold">Overdue</span>
          </div>
        </div>
      </Link>

      {/* Card 3: Demos */}
      <Link
        href="/demos"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-200 flex flex-col justify-between group space-y-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-purple-500 before:to-pink-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Product Demos</span>
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
            <Presentation className="w-4 h-4" />
          </div>
        </div>

        <div>
          <span className="text-3xl font-black text-slate-900 tracking-tight">
            {loading ? '-' : summary.upcomingDemosCount}
          </span>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Upcoming Demos</span>
        </div>

        <div className="pt-3 border-t border-slate-100/80 grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-purple-50 p-1.5 rounded-xl text-purple-900 font-medium text-center">
            <span className="block font-black text-xs">{loading ? '-' : summary.todayDemosCount}</span>
            <span className="font-semibold">Today's</span>
          </div>
          <div className="bg-slate-50 p-1.5 rounded-xl text-slate-700 font-medium text-center">
            <span className="block font-black text-xs">{loading ? '-' : summary.completedDemosCount}</span>
            <span className="font-semibold">Done</span>
          </div>
        </div>
      </Link>

      {/* Card 4: Quotations */}
      <Link
        href="/quotations"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-200 flex flex-col justify-between group space-y-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-blue-500 before:to-cyan-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Quotations</span>
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-200">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {loading ? '-' : summary.totalQuotations}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60">
              {loading ? '-' : `${summary.quotationAcceptanceRate}% Rate`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Proposals & Quotes</span>
        </div>

        <div className="pt-3 border-t border-slate-100/80 grid grid-cols-3 gap-1 text-[10px]">
          <div className="bg-slate-50 p-1.5 rounded-xl text-center">
            <span className="block font-black text-slate-800 text-xs">{loading ? '-' : summary.draftQuotations}</span>
            <span className="text-slate-400 font-semibold">Draft</span>
          </div>
          <div className="bg-indigo-50 p-1.5 rounded-xl text-center text-indigo-800">
            <span className="block font-black text-xs">{loading ? '-' : summary.sentQuotations}</span>
            <span className="font-semibold">Sent</span>
          </div>
          <div className="bg-emerald-50 p-1.5 rounded-xl text-center text-emerald-800">
            <span className="block font-black text-xs">{loading ? '-' : summary.acceptedQuotations}</span>
            <span className="font-semibold">Accepted</span>
          </div>
        </div>
      </Link>

      {/* Card 5: Clients */}
      <Link
        href="/clients"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between group space-y-3 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-emerald-500 before:to-teal-500"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Clients</span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
            <Trophy className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {loading ? '-' : summary.totalClients}
            </span>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {loading ? '-' : `${summary.overallConversionRate}% Conv.`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Converted Clients</span>
        </div>

        <div className="pt-3 border-t border-slate-100/80 grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-emerald-50 p-1.5 rounded-xl text-emerald-900 font-medium text-center">
            <span className="block font-black text-xs">{loading ? '-' : summary.activeClients}</span>
            <span className="font-semibold">Active</span>
          </div>
          <div className="bg-indigo-50 p-1.5 rounded-xl text-indigo-900 font-medium text-center">
            <span className="block font-black text-xs">{loading ? '-' : summary.convertedThisMonth}</span>
            <span className="font-semibold">This Month</span>
          </div>
        </div>
      </Link>
    </div>
  );
};
