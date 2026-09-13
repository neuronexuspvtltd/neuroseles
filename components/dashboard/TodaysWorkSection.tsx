'use client';

import React from 'react';
import {
  CalendarClock,
  Presentation,
  CheckCircle2,
  Phone,
  Clock,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { FollowUpCard, FollowUpItemData } from '@/components/followups/FollowUpCard';

interface TodaysWorkSectionProps {
  todayFollowUps: FollowUpItemData[];
  todayDemos: any[];
  onCallFollowUp: (followUp: FollowUpItemData) => void;
  onCompleteFollowUp: (followUp: FollowUpItemData) => void;
  onRescheduleFollowUp: (followUp: FollowUpItemData) => void;
  onCompleteDemo?: (demo: any) => void;
  loading?: boolean;
}

export const TodaysWorkSection: React.FC<TodaysWorkSectionProps> = ({
  todayFollowUps = [],
  todayDemos = [],
  onCallFollowUp,
  onCompleteFollowUp,
  onRescheduleFollowUp,
  onCompleteDemo,
  loading = false,
}) => {
  const hasWorkToday = todayFollowUps.length > 0 || todayDemos.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" /> Today's Work & Scheduled Operations
          </h2>
          <p className="text-xs text-slate-500">
            Action items and product demonstrations scheduled for today ({new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            {todayFollowUps.length + todayDemos.length} Task{todayFollowUps.length + todayDemos.length !== 1 ? 's' : ''} Today
          </span>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 text-center py-8">Loading today's schedule...</p>
      ) : !hasWorkToday ? (
        <div className="p-8 bg-slate-50/70 border border-slate-200/80 rounded-xl text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No tasks scheduled for today.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You're all caught up! Use the quick action buttons to schedule new follow-ups or product demos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Follow-ups */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-indigo-600" />
                Today's Follow-ups ({todayFollowUps.length})
              </h3>
              <Link href="/follow-ups" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All
              </Link>
            </div>

            {todayFollowUps.length === 0 ? (
              <div className="p-5 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                No follow-up calls scheduled for today.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {todayFollowUps.map((item) => (
                  <FollowUpCard
                    key={item.id}
                    item={item}
                    onCall={onCallFollowUp}
                    onComplete={onCompleteFollowUp}
                    onReschedule={onRescheduleFollowUp}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Today's Demos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Presentation className="w-4 h-4 text-purple-600" />
                Today's Demos ({todayDemos.length})
              </h3>
              <Link href="/demos" className="text-xs font-semibold text-purple-600 hover:underline">
                View All
              </Link>
            </div>

            {todayDemos.length === 0 ? (
              <div className="p-5 bg-purple-50/30 rounded-xl text-xs text-purple-700 text-center">
                No product demos scheduled for today.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {todayDemos.map((demo) => (
                  <div
                    key={demo.id}
                    className="p-4 bg-purple-50/40 border border-purple-200 rounded-xl space-y-3 text-xs shadow-sm hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/demos/${demo.id}`}
                          className="font-bold text-slate-900 text-sm hover:text-purple-700"
                        >
                          {demo.lead?.name || 'Customer'}
                        </Link>
                        <span className="text-slate-500 block text-[11px] font-mono">
                          {formatPhoneNumber(demo.lead?.mobile || '')}
                        </span>
                      </div>
                      <span className="font-bold text-purple-800 bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-sm text-xs">
                        {demo.demoTime}
                      </span>
                    </div>

                    {demo.notes && (
                      <p className="text-slate-700 bg-white/80 p-2.5 rounded-lg border border-purple-100 text-xs">
                        {demo.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-purple-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {demo.demoLink ? (
                          <a
                            href={demo.demoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-indigo-600 text-white font-semibold text-[11px] rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Meeting Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No link</span>
                        )}
                        <Link
                          href={`/demos/${demo.id}`}
                          className="px-2.5 py-1 bg-white border border-purple-200 text-purple-700 font-semibold text-[11px] rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>

                      {onCompleteDemo && (
                        <button
                          onClick={() => onCompleteDemo(demo)}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-semibold text-[11px] rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Complete Demo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
