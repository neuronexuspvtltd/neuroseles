'use client';

import React from 'react';
import Link from 'next/link';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { Phone, CheckCircle, CalendarClock, Clock, AlertTriangle } from 'lucide-react';

export interface FollowUpItemData {
  id: string;
  leadId: string;
  followUpDate: string;
  followUpTime: string;
  note: string;
  status: string;
  lead: {
    id: string;
    name: string;
    mobile: string;
    company: string | null;
    status: string;
  };
}

interface FollowUpCardProps {
  item: FollowUpItemData;
  isOverdue?: boolean;
  onCall: (item: FollowUpItemData) => void;
  onComplete: (item: FollowUpItemData) => void;
  onReschedule: (item: FollowUpItemData) => void;
}

export const FollowUpCard: React.FC<FollowUpCardProps> = ({
  item,
  isOverdue = false,
  onCall,
  onComplete,
  onReschedule,
}) => {
  const initials = item.lead.name
    ? item.lead.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'LD';

  return (
    <div
      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${
        isOverdue
          ? 'border-rose-300/80 bg-rose-50/20'
          : 'border-slate-200/80'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/leads/${item.lead.id}`}
                className="font-bold text-slate-900 text-base hover:text-teal-600 transition-colors"
              >
                {item.lead.name}
              </Link>
              {item.lead.company && (
                <span className="text-xs text-slate-400 font-medium">
                  ({item.lead.company})
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              {formatPhoneNumber(item.lead.mobile)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOverdue && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300/80 shadow-2xs">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              OVERDUE
            </span>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50/90 border border-amber-200/80 text-amber-900 rounded-full text-xs font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {item.followUpDate} at {item.followUpTime}
            </span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="py-3 text-xs text-slate-700 bg-slate-50/50 rounded-xl px-3.5 my-2 border border-slate-100/80">
        <span className="font-bold text-slate-900">Follow-up Note: </span>
        <span className="text-slate-600">{item.note}</span>
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-end gap-2">
        <button
          onClick={() => onCall(item)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl border border-indigo-200/80 transition-all active:scale-95 cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call</span>
        </button>

        <button
          onClick={() => onReschedule(item)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100/80 rounded-xl border border-amber-200/80 transition-all active:scale-95 cursor-pointer"
        >
          <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
          <span>Reschedule</span>
        </button>

        <button
          onClick={() => onComplete(item)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Complete</span>
        </button>
      </div>
    </div>
  );
};
