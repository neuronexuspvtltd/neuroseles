'use client';

import React from 'react';
import { AlertCircle, Phone, CheckCircle, RefreshCw, Calendar, Clock } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { FollowUpItemData } from '@/components/followups/FollowUpCard';

interface OverdueSectionProps {
  overdueFollowUps: (FollowUpItemData & { daysOverdue?: number })[];
  onCall: (followUp: FollowUpItemData) => void;
  onComplete: (followUp: FollowUpItemData) => void;
  onReschedule: (followUp: FollowUpItemData) => void;
}

export const OverdueSection: React.FC<OverdueSectionProps> = ({
  overdueFollowUps = [],
  onCall,
  onComplete,
  onReschedule,
}) => {
  if (overdueFollowUps.length === 0) return null;

  return (
    <div className="bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-rose-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-600 text-white rounded-xl shadow-2xs">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-rose-900">
              Overdue Follow-ups Warning ({overdueFollowUps.length})
            </h3>
            <p className="text-xs text-rose-700 font-medium">
              These pending follow-ups have passed their scheduled date. Action required!
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-3 py-1 bg-rose-600 text-white rounded-full">
          {overdueFollowUps.length} Pending
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {overdueFollowUps.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm truncate" title={item.lead.name}>
                  {item.lead.name}
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md border border-rose-200 shrink-0">
                  {item.daysOverdue || 1} Day{item.daysOverdue !== 1 ? 's' : ''} Overdue
                </span>
              </div>

              <p className="text-xs text-slate-500 font-mono">{formatPhoneNumber(item.lead.mobile)}</p>

              <div className="flex items-center gap-2 text-[11px] text-rose-700 font-semibold pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Scheduled: {item.followUpDate} at {item.followUpTime}</span>
              </div>

              {item.note && (
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-snug line-clamp-2">
                  {item.note}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
              <button
                onClick={() => onCall(item)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-1 text-[11px]"
              >
                <Phone className="w-3 h-3" /> Call
              </button>
              <button
                onClick={() => onComplete(item)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition-colors inline-flex items-center gap-1 text-[11px]"
              >
                <CheckCircle className="w-3 h-3" /> Complete
              </button>
              <button
                onClick={() => onReschedule(item)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors inline-flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" /> Reschedule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
