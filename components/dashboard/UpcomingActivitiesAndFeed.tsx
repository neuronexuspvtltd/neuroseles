'use client';

import React from 'react';
import {
  CalendarClock,
  Presentation,
  Activity as ActivityIcon,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { formatPhoneNumber } from '@/lib/phoneUtils';

interface ActivityFeedItem {
  id: string;
  description: string;
  createdAt: string;
  lead?: { id: string; name: string; mobile: string; company?: string | null };
  client?: { id: string; name: string; mobile: string; company?: string | null };
}

interface UpcomingActivityItem {
  id: string;
  type: 'FOLLOW_UP' | 'DEMO';
  title: string;
  customerName: string;
  customerMobile: string;
  leadId: string;
  date: string;
  time: string;
  note: string;
  demoLink?: string | null;
  status: string;
}

interface UpcomingActivitiesAndFeedProps {
  upcomingActivities: UpcomingActivityItem[];
  recentActivities: ActivityFeedItem[];
  onRefreshActivity?: () => void;
}

export const UpcomingActivitiesAndFeed: React.FC<UpcomingActivitiesAndFeedProps> = ({
  upcomingActivities = [],
  recentActivities = [],
  onRefreshActivity,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Upcoming Activities Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" /> Upcoming Activities & Schedule
              </h3>
              <p className="text-xs text-slate-500">Upcoming follow-ups and product demos in chronological order</p>
            </div>
          </div>

          {upcomingActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl my-4">
              No upcoming activities scheduled.
            </div>
          ) : (
            <div className="pt-4 space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {upcomingActivities.map((act) => {
                const isDemo = act.type === 'DEMO';
                return (
                  <div
                    key={act.id}
                    className={`p-3.5 rounded-xl border ${isDemo ? 'bg-purple-50/40 border-purple-200' : 'bg-slate-50 border-slate-200'} text-xs space-y-2 flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isDemo ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'}`}>
                          {isDemo ? 'Demo' : 'Follow-up'}
                        </span>
                        <Link
                          href={`/leads/${act.leadId}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 truncate max-w-[180px]"
                        >
                          {act.customerName}
                        </Link>
                      </div>
                      <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {act.date} • {act.time}
                      </span>
                    </div>

                    {act.note && (
                      <p className="text-slate-600 text-[11px] bg-white p-2 rounded-lg border border-slate-100 line-clamp-2">
                        {act.note}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">{formatPhoneNumber(act.customerMobile)}</span>
                      <Link
                        href={isDemo ? `/demos` : `/leads/${act.leadId}`}
                        className="font-semibold text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Recent Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-indigo-600" /> Recent System Activity
              </h3>
              <p className="text-xs text-slate-500">Live operational log from database audit system</p>
            </div>
            {onRefreshActivity && (
              <button
                onClick={onRefreshActivity}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                title="Refresh Feed"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl my-4">
              No recent activity logged.
            </div>
          ) : (
            <div className="pt-4 space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {recentActivities.map((act) => {
                const target = act.lead || act.client;
                const linkHref = act.client ? `/clients/${act.client.id}` : act.lead ? `/leads/${act.lead.id}` : '#';

                return (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      {target ? (
                        <Link href={linkHref} className="font-bold text-slate-900 hover:text-indigo-600 truncate max-w-[200px]">
                          {target.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-900">System</span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {format(parseISO(act.createdAt), 'dd MMM, hh:mm a')}
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-snug">{act.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
