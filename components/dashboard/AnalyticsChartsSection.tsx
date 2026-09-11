'use client';

import React from 'react';
import {
  BarChart3,
  PieChart,
  IndianRupee,
  FileText,
  CheckCircle2,
  TrendingUp,
  Globe,
  Share2,
} from 'lucide-react';

interface LeadSourceItem {
  source: string;
  count: number;
  percentage: number;
}

interface TrendItem {
  label: string;
  count: number;
}

interface QuotationAnalytics {
  totalQuotations: number;
  draft: number;
  sent: number;
  viewed: number;
  accepted: number;
  rejected: number;
  expired: number;
  totalValue: number;
  acceptedValue: number;
  acceptanceRate: number;
}

interface ClientConversionAnalytics {
  totalConverted: number;
  convertedThisMonth: number;
  convertedThisYear: number;
  conversionRate: number;
}

interface AnalyticsChartsSectionProps {
  leadSources: LeadSourceItem[];
  leadGenerationTrend: TrendItem[];
  quotationAnalytics: QuotationAnalytics;
  clientConversion: ClientConversionAnalytics;
}

export const AnalyticsChartsSection: React.FC<AnalyticsChartsSectionProps> = ({
  leadSources = [],
  leadGenerationTrend = [],
  quotationAnalytics,
  clientConversion,
}) => {
  const maxTrendCount = Math.max(1, ...leadGenerationTrend.map((t) => t.count));

  const sourceColors: Record<string, string> = {
    Website: 'bg-blue-600',
    WhatsApp: 'bg-emerald-600',
    Instagram: 'bg-pink-600',
    Facebook: 'bg-indigo-600',
    Referral: 'bg-purple-600',
    Direct: 'bg-teal-600',
    Other: 'bg-amber-600',
    Unknown: 'bg-slate-500',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Lead Generation Trend Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" /> Lead Generation Over Time
              </h3>
              <p className="text-xs text-slate-500">Leads captured across the selected date range</p>
            </div>
          </div>

          {leadGenerationTrend.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl my-4">
              No lead creation records for this date range.
            </div>
          ) : (
            <div className="pt-6 space-y-3">
              <div className="h-44 flex items-end justify-between gap-2 border-b border-slate-200 pb-2 px-1">
                {leadGenerationTrend.map((item, idx) => {
                  const heightPercent = Math.max(12, Math.round((item.count / maxTrendCount) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded absolute -top-8 z-10 pointer-events-none whitespace-nowrap shadow-md">
                        {item.count} lead{item.count !== 1 ? 's' : ''} ({item.label})
                      </div>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] bg-indigo-600 group-hover:bg-indigo-700 rounded-t-md transition-all shadow-2xs"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-500">
                {leadGenerationTrend.map((item, idx) => (
                  <span key={idx} className="flex-1 text-center truncate px-0.5">
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Lead Sources Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" /> Lead Source Analytics
              </h3>
              <p className="text-xs text-slate-500">Channel distribution of incoming leads</p>
            </div>
          </div>

          {leadSources.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl my-4">
              No lead source data available.
            </div>
          ) : (
            <div className="pt-4 space-y-3 max-h-52 overflow-y-auto pr-1">
              {leadSources.map((src) => {
                const color = sourceColors[src.source] || 'bg-indigo-600';
                return (
                  <div key={src.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{src.source}</span>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span>{src.count} leads</span>
                        <span className="text-slate-400 font-mono">({src.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(5, src.percentage)}%` }}
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Quotation Analytics Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" /> Quotations & Revenue Performance
            </h3>
            <p className="text-xs text-slate-500">Proposal status metrics & financial total values</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
            {quotationAnalytics?.acceptanceRate || 0}% Acceptance Rate
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Proposals Value
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{(quotationAnalytics?.totalValue || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              Across {quotationAnalytics?.totalQuotations || 0} proposals
            </span>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Accepted Revenue Value
            </span>
            <span className="text-xl font-black text-emerald-900 font-mono">
              ₹{(quotationAnalytics?.acceptedValue || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-700 block font-medium">
              {quotationAnalytics?.accepted || 0} accepted quotes
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] font-bold text-center">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="block text-slate-900 text-sm">{quotationAnalytics?.draft || 0}</span>
            <span className="text-slate-400">Draft</span>
          </div>
          <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 text-indigo-900">
            <span className="block text-sm">{quotationAnalytics?.sent || 0}</span>
            <span>Sent</span>
          </div>
          <div className="bg-cyan-50 p-2 rounded-lg border border-cyan-100 text-cyan-900">
            <span className="block text-sm">{quotationAnalytics?.viewed || 0}</span>
            <span>Viewed</span>
          </div>
          <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-emerald-900">
            <span className="block text-sm">{quotationAnalytics?.accepted || 0}</span>
            <span>Accepted</span>
          </div>
          <div className="bg-rose-50 p-2 rounded-lg border border-rose-100 text-rose-900">
            <span className="block text-sm">{quotationAnalytics?.rejected || 0}</span>
            <span>Rejected</span>
          </div>
          <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 text-slate-600">
            <span className="block text-sm">{quotationAnalytics?.expired || 0}</span>
            <span>Expired</span>
          </div>
        </div>
      </div>

      {/* 4. Client Conversion Analytics Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Client Conversion Performance
            </h3>
            <p className="text-xs text-slate-500">Overall lead conversion efficiency & growth</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Overall Conversion
            </span>
            <span className="text-2xl font-black text-emerald-900">
              {clientConversion?.conversionRate || 0}%
            </span>
            <span className="text-[10px] text-emerald-700 block font-medium">Lead to Client Ratio</span>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
              This Month
            </span>
            <span className="text-2xl font-black text-indigo-900">
              {clientConversion?.convertedThisMonth || 0}
            </span>
            <span className="text-[10px] text-indigo-700 block font-medium">New Converted Clients</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              This Year
            </span>
            <span className="text-2xl font-black text-slate-900">
              {clientConversion?.convertedThisYear || 0}
            </span>
            <span className="text-[10px] text-slate-500 block font-medium">Total Converted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
