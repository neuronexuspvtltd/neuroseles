'use client';

import React from 'react';
import { GitCommit, ChevronRight, ArrowRight, UserPlus, Phone, Heart, CalendarClock, Presentation, FileText, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface LeadPipelineSectionProps {
  pipeline: {
    NEW: number;
    CALLED: number;
    INTERESTED: number;
    FOLLOW_UP: number;
    DEMO: number;
    QUOTATION: number;
    NOT_INTERESTED: number;
    CONVERTED: number;
  };
  totalLeads?: number;
}

export const LeadPipelineSection: React.FC<LeadPipelineSectionProps> = ({ pipeline, totalLeads = 0 }) => {
  const total = totalLeads || Object.values(pipeline).reduce((a, b) => a + b, 0) || 1;

  const stages = [
    { key: 'NEW', label: 'New Lead', count: pipeline.NEW || 0, icon: UserPlus, bg: 'bg-blue-50/80 hover:bg-blue-100/70', text: 'text-blue-700', border: 'border-blue-200/80', badge: 'bg-blue-100 text-blue-800' },
    { key: 'CALLED', label: 'Called', count: pipeline.CALLED || 0, icon: Phone, bg: 'bg-indigo-50/80 hover:bg-indigo-100/70', text: 'text-indigo-700', border: 'border-indigo-200/80', badge: 'bg-indigo-100 text-indigo-800' },
    { key: 'INTERESTED', label: 'Interested', count: pipeline.INTERESTED || 0, icon: Heart, bg: 'bg-purple-50/80 hover:bg-purple-100/70', text: 'text-purple-700', border: 'border-purple-200/80', badge: 'bg-purple-100 text-purple-800' },
    { key: 'FOLLOW_UP', label: 'Follow-up', count: pipeline.FOLLOW_UP || 0, icon: CalendarClock, bg: 'bg-amber-50/80 hover:bg-amber-100/70', text: 'text-amber-800', border: 'border-amber-200/80', badge: 'bg-amber-100 text-amber-900' },
    { key: 'DEMO', label: 'Demo', count: pipeline.DEMO || 0, icon: Presentation, bg: 'bg-cyan-50/80 hover:bg-cyan-100/70', text: 'text-cyan-800', border: 'border-cyan-200/80', badge: 'bg-cyan-100 text-cyan-900' },
    { key: 'QUOTATION', label: 'Quotation', count: pipeline.QUOTATION || 0, icon: FileText, bg: 'bg-teal-50/80 hover:bg-teal-100/70', text: 'text-teal-800', border: 'border-teal-200/80', badge: 'bg-teal-100 text-teal-900' },
    { key: 'CONVERTED', label: 'Converted', count: pipeline.CONVERTED || 0, icon: CheckCircle2, bg: 'bg-emerald-50/80 hover:bg-emerald-100/70', text: 'text-emerald-800', border: 'border-emerald-200/80', badge: 'bg-emerald-100 text-emerald-900' },
    { key: 'NOT_INTERESTED', label: 'Not Interested', count: pipeline.NOT_INTERESTED || 0, icon: XCircle, bg: 'bg-slate-50 hover:bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-200 text-slate-700' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-600" /> Lead Stage Pipeline Breakdown
          </h3>
          <p className="text-xs text-slate-500">Distribution of leads across active sales stages</p>
        </div>
        <Link href="/leads" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
          <span>View Lead Board</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {stages.map((st) => {
          const Icon = st.icon;
          const percentage = Math.round((st.count / total) * 100);

          return (
            <Link
              key={st.key}
              href={`/leads?status=${st.key}`}
              className={`p-4 rounded-xl border ${st.border} ${st.bg} transition-all space-y-3 flex flex-col justify-between group shadow-2xs hover:shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${st.text}`}>
                  {st.label}
                </span>
                <div className={`p-1.5 rounded-lg bg-white/80 shadow-2xs ${st.text}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className={`text-2xl font-black ${st.text}`}>{st.count}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${st.badge}`}>
                  {percentage}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
