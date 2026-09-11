'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  CalendarClock,
  Presentation,
  AlertTriangle,
  ExternalLink,
  X,
  Trash2,
  RotateCcw,
} from 'lucide-react';

export const HeaderNotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{
    todayFollowUps: any[];
    todayDemos: any[];
    overdueCount: number;
    allOverdue: any[];
  }>({
    todayFollowUps: [],
    todayDemos: [],
    overdueCount: 0,
    allOverdue: [],
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load dismissed IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('crm_dismissed_reminders');
      if (saved) {
        setDismissedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save dismissed IDs to localStorage
  const saveDismissed = (newIds: string[]) => {
    setDismissedIds(newIds);
    try {
      localStorage.setItem('crm_dismissed_reminders', JSON.stringify(newIds));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReminders = async () => {
    try {
      const [statsRes, followUpsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/follow-ups'),
      ]);

      if (statsRes.ok && followUpsRes.ok) {
        const statsData = await statsRes.json();
        const followUpsData = await followUpsRes.json();

        setData({
          todayFollowUps: statsData.todayFollowUps || [],
          todayDemos: statsData.todayDemos || [],
          overdueCount: statsData.overdueCount || 0,
          allOverdue: followUpsData.overdueFollowUps || [],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter out dismissed items
  const visibleOverdue = data.allOverdue.filter(
    (item) => !dismissedIds.includes(`overdue-${item.id}`)
  );
  const visibleTodayFollowUps = data.todayFollowUps.filter(
    (item) => !dismissedIds.includes(`tfu-${item.id}`)
  );
  const visibleTodayDemos = data.todayDemos.filter(
    (demo) => !dismissedIds.includes(`demo-${demo.id}`)
  );

  const totalCount =
    visibleOverdue.length + visibleTodayFollowUps.length + visibleTodayDemos.length;

  const handleDismissItem = (key: string) => {
    if (!dismissedIds.includes(key)) {
      saveDismissed([...dismissedIds, key]);
    }
  };

  const handleClearAll = () => {
    const allKeys = [
      ...data.allOverdue.map((i) => `overdue-${i.id}`),
      ...data.todayFollowUps.map((i) => `tfu-${i.id}`),
      ...data.todayDemos.map((d) => `demo-${d.id}`),
    ];
    saveDismissed(Array.from(new Set([...dismissedIds, ...allKeys])));
  };

  const handleRestoreAll = () => {
    saveDismissed([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchReminders();
        }}
        className={`relative p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
          visibleOverdue.length > 0
            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
            : totalCount > 0
            ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
        title="In-App Reminders"
      >
        <Bell
          className={`w-4 h-4 ${
            visibleOverdue.length > 0
              ? 'text-rose-600 animate-pulse'
              : totalCount > 0
              ? 'text-amber-600'
              : 'text-slate-400'
          }`}
        />
        <span className="hidden sm:inline">Reminders</span>
        {totalCount > 0 && (
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              visibleOverdue.length > 0 ? 'bg-rose-600' : 'bg-amber-600'
            }`}
          >
            {totalCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-xs">Reminders & Notifications</h3>
            </div>

            <div className="flex items-center gap-2">
              {totalCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors"
                  title="Dismiss all current notifications"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {totalCount === 0 ? (
              <div className="p-6 text-center text-xs space-y-2">
                <p className="text-slate-500 font-medium">No active reminders right now. All clear!</p>
                {dismissedIds.length > 0 && (
                  <button
                    onClick={handleRestoreAll}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold text-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore Cleared Reminders</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Overdue Section */}
                {visibleOverdue.length > 0 && (
                  <div className="p-3 bg-rose-50/50 space-y-2">
                    <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1 uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Overdue Follow-ups ({visibleOverdue.length})
                    </div>
                    {visibleOverdue.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white rounded-lg border border-rose-200 text-xs shadow-2xs group relative"
                      >
                        <div className="flex justify-between items-start font-bold text-slate-900 pr-5">
                          <Link href={`/leads/${item.lead.id}`} onClick={() => setOpen(false)}>
                            {item.lead.name}
                          </Link>
                          <span className="text-[10px] text-rose-700 font-mono">{item.followUpDate}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{item.note}</p>

                        {/* Individual Dismiss X button */}
                        <button
                          onClick={() => handleDismissItem(`overdue-${item.id}`)}
                          className="absolute right-2 top-2 p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Today's Follow-ups */}
                {visibleTodayFollowUps.length > 0 && (
                  <div className="p-3 bg-amber-50/30 space-y-2">
                    <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1 uppercase tracking-wider">
                      <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                      Today's Follow-ups ({visibleTodayFollowUps.length})
                    </div>
                    {visibleTodayFollowUps.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs shadow-2xs group relative"
                      >
                        <div className="flex justify-between items-start font-bold text-slate-900 pr-5">
                          <Link href={`/leads/${item.lead.id}`} onClick={() => setOpen(false)}>
                            {item.lead.name}
                          </Link>
                          <span className="text-[10px] font-mono text-amber-700">{item.followUpTime}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{item.note}</p>

                        {/* Individual Dismiss X button */}
                        <button
                          onClick={() => handleDismissItem(`tfu-${item.id}`)}
                          className="absolute right-2 top-2 p-1 text-slate-300 hover:text-amber-700 rounded transition-colors"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Today's Demos */}
                {visibleTodayDemos.length > 0 && (
                  <div className="p-3 bg-purple-50/30 space-y-2">
                    <div className="text-[11px] font-bold text-purple-800 flex items-center gap-1 uppercase tracking-wider">
                      <Presentation className="w-3.5 h-3.5 text-purple-600" />
                      Today's Scheduled Demos ({visibleTodayDemos.length})
                    </div>
                    {visibleTodayDemos.slice(0, 5).map((demo) => (
                      <div
                        key={demo.id}
                        className="p-2.5 bg-white rounded-lg border border-purple-200 text-xs space-y-1 relative"
                      >
                        <div className="flex justify-between items-start font-bold text-slate-900 pr-5">
                          <Link href={`/demos/${demo.id}`} onClick={() => setOpen(false)}>
                            {demo.lead.name}
                          </Link>
                          <span className="text-[10px] font-mono text-purple-700">{demo.demoTime}</span>
                        </div>
                        {demo.demoLink && (
                          <a
                            href={demo.demoLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <span>Open Meeting URL</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {/* Individual Dismiss X button */}
                        <button
                          onClick={() => handleDismissItem(`demo-${demo.id}`)}
                          className="absolute right-2 top-2 p-1 text-slate-300 hover:text-purple-700 rounded transition-colors"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Quick Links */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
            <Link
              href="/follow-ups"
              onClick={() => setOpen(false)}
              className="text-amber-700 hover:underline"
            >
              View All Follow-ups →
            </Link>
            <Link
              href="/demos"
              onClick={() => setOpen(false)}
              className="text-purple-700 hover:underline"
            >
              View All Demos →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
