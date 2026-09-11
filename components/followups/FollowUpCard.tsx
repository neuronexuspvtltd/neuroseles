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
  return (
    <div
      className={`bg-white rounded-xl border p-4 shadow-xs transition-shadow hover:shadow-md ${
        isOverdue
          ? 'border-rose-300 bg-rose-50/20'
          : 'border-slate-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/leads/${item.lead.id}`}
              className="font-bold text-slate-900 text-base hover:text-indigo-600 transition-colors"
            >
              {item.lead.name}
            </Link>
            {item.lead.company && (
              <span className="text-xs text-slate-500 font-medium">
                ({item.lead.company})
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-slate-600 mt-0.5">
            {formatPhoneNumber(item.lead.mobile)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOverdue && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              OVERDUE
            </span>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {item.followUpDate} at {item.followUpTime}
            </span>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="py-3 text-xs text-slate-700">
        <span className="font-semibold text-slate-900">Follow-up Note: </span>
        <span>{item.note}</span>
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-end gap-2">
        <button
          onClick={() => onCall(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call</span>
        </button>

        <button
          onClick={() => onComplete(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Mark Completed</span>
        </button>

        <button
          onClick={() => onReschedule(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
        >
          <CalendarClock className="w-3.5 h-3.5" />
          <span>Reschedule</span>
        </button>
      </div>
    </div>
  );
};
