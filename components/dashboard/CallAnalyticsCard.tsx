'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Phone,
  PhoneOff,
  Heart,
  CheckCircle2,
  XCircle,
  Clock,
  Presentation,
  FileText,
  Filter,
} from 'lucide-react';

interface CallSummary {
  total: number;
  connected: number;
  notConnected: number;
  conversionRate: number;
  responses: Record<string, number>;
  results: Record<string, number>;
}

interface CallAnalyticsCardProps {
  callAnalytics?: {
    today: CallSummary;
    weekly: CallSummary;
    monthly: CallSummary;
    inPeriod: CallSummary;
  };
  period?: string;
}

export const CallAnalyticsCard: React.FC<CallAnalyticsCardProps> = ({
  callAnalytics,
  period = 'all',
}) => {
  const [selectedTab, setSelectedTab] = useState<'today' | 'weekly' | 'monthly' | 'inPeriod'>('inPeriod');

  useEffect(() => {
    if (period === 'today') {
      setSelectedTab('today');
    } else if (period === '7days') {
      setSelectedTab('weekly');
    } else if (period === 'this_month' || period === 'last_month') {
      setSelectedTab('monthly');
    } else {
      setSelectedTab('inPeriod');
    }
  }, [period]);

  const currentSummary = callAnalytics?.[selectedTab] || {
    total: 0,
    connected: 0,
    notConnected: 0,
    conversionRate: 0,
    responses: {
      'General Call': 0,
      Interested: 0,
      'Demo Required': 0,
      'Quotation Required': 0,
      'Call Later': 0,
      'Not Interested': 0,
      Converted: 0,
    },
    results: {
      'Call Received': 0,
      'Call Not Received': 0,
      Busy: 0,
      'Wrong Number': 0,
    },
  };

  const responseBadges = [
    {
      key: 'Interested',
      label: 'Interested',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      bar: 'bg-emerald-500',
      icon: Heart,
    },
    {
      key: 'Demo Required',
      label: 'Demo Required',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      bar: 'bg-purple-500',
      icon: Presentation,
    },
    {
      key: 'Quotation Required',
      label: 'Quotation Req.',
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      bar: 'bg-teal-500',
      icon: FileText,
    },
    {
      key: 'Call Later',
      label: 'Call Later',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      bar: 'bg-amber-500',
      icon: Clock,
    },
    {
      key: 'General Call',
      label: 'General Call',
      color: 'bg-slate-50 text-slate-800 border-slate-200',
      bar: 'bg-slate-500',
      icon: Phone,
    },
    {
      key: 'Not Interested',
      label: 'Not Interested',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      bar: 'bg-rose-500',
      icon: XCircle,
    },
    {
      key: 'Converted',
      label: 'Converted',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      bar: 'bg-indigo-500',
      icon: CheckCircle2,
    },
  ];

  const resultBadges = [
    { key: 'Call Received', label: 'Call Received (Connected)', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
    { key: 'Call Not Received', label: 'Call Not Received', color: 'bg-amber-50 border-amber-200 text-amber-900' },
    { key: 'Busy', label: 'Line Busy', color: 'bg-orange-50 border-orange-200 text-orange-900' },
    { key: 'Wrong Number', label: 'Wrong Number', color: 'bg-rose-50 border-rose-200 text-rose-900' },
  ];

  // Helper label for active tab
  const tabLabels: Record<string, string> = {
    today: "Today's Calls",
    weekly: 'Weekly Calls (Last 7 Days)',
    monthly: 'Monthly Calls (This Month)',
    inPeriod: `Filtered Period (${period.replace('_', ' ').toUpperCase()})`,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Header & Segmented Tab Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-indigo-600" />
            Call Analytics & Response Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total calls made, connection rates, and outcome responses (Interested, Not Interested, Demos, Quotes)
          </p>
        </div>

        {/* Tabs: Today | Weekly | Monthly | Filtered Period */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setSelectedTab('today')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedTab === 'today'
                ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today ({callAnalytics?.today?.total || 0})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('weekly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedTab === 'weekly'
                ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly ({callAnalytics?.weekly?.total || 0})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('monthly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedTab === 'monthly'
                ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly ({callAnalytics?.monthly?.total || 0})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('inPeriod')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              selectedTab === 'inPeriod'
                ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Filter className="w-3 h-3 text-indigo-500" />
            Filtered ({callAnalytics?.inPeriod?.total || 0})
          </button>
        </div>
      </div>

      {/* Top 4 KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 space-y-1">
          <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-indigo-600" /> Total Calls
          </span>
          <span className="text-2xl font-black text-indigo-950 block">{currentSummary.total}</span>
          <span className="text-[10px] text-indigo-600 font-medium block">Total call attempts</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
          </span>
          <span className="text-2xl font-black text-emerald-950 block">{currentSummary.connected}</span>
          <span className="text-[10px] text-emerald-600 font-medium block">
            {currentSummary.total ? Math.round((currentSummary.connected / currentSummary.total) * 100) : 0}% connection rate
          </span>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-100 space-y-1">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <PhoneOff className="w-3.5 h-3.5 text-rose-600" /> Not Connected
          </span>
          <span className="text-2xl font-black text-rose-950 block">{currentSummary.notConnected}</span>
          <span className="text-[10px] text-rose-600 font-medium block">Unanswered / busy lines</span>
        </div>

        <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-100 space-y-1">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-purple-600" /> Positive Rate
          </span>
          <span className="text-2xl font-black text-purple-950 block">{currentSummary.conversionRate}%</span>
          <span className="text-[10px] text-purple-600 font-medium block">Interested / Demo / Quote ratio</span>
        </div>
      </div>

      {/* Customer Response / Outcome Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            Response Outcome Breakdown
            <span className="text-[11px] font-semibold text-slate-400 normal-case">
              ({tabLabels[selectedTab] || selectedTab})
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {responseBadges.map((badge) => {
            const count = currentSummary.responses[badge.key] || 0;
            const percentage = currentSummary.connected
              ? Math.round((count / currentSummary.connected) * 100)
              : 0;
            const Icon = badge.icon;

            return (
              <div
                key={badge.key}
                className={`p-3.5 rounded-xl border ${badge.color} space-y-2.5 flex flex-col justify-between transition-all hover:shadow-2xs`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold truncate">{badge.label}</span>
                  <Icon className="w-4 h-4 shrink-0 opacity-80" />
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black tracking-tight">{count}</span>
                    <span className="text-[11px] font-mono font-bold opacity-80">{percentage}%</span>
                  </div>
                  <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden mt-1.5">
                    <div
                      style={{ width: `${Math.max(percentage > 0 ? 6 : 0, percentage)}%` }}
                      className={`h-full ${badge.bar} rounded-full transition-all duration-300`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call Result Breakdown (Connected vs Busy vs Unanswered) */}
      <div className="pt-4 border-t border-slate-100 space-y-2.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Call Connection Status Breakdown
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {resultBadges.map((res) => {
            const count = currentSummary.results[res.key] || 0;
            return (
              <div
                key={res.key}
                className={`p-3 rounded-xl border ${res.color} flex items-center justify-between font-semibold shadow-2xs`}
              >
                <span className="truncate">{res.label}</span>
                <span className="font-black font-mono text-sm shrink-0 ml-2">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
