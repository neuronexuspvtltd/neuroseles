'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FollowUpCard, FollowUpItemData } from '@/components/followups/FollowUpCard';
import { MarkCalledModal } from '@/components/leads/MarkCalledModal';
import { ScheduleFollowUpModal } from '@/components/leads/ScheduleFollowUpModal';
import { CalendarClock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue'>('today');

  const [todayList, setTodayList] = useState<FollowUpItemData[]>([]);
  const [upcomingList, setUpcomingList] = useState<FollowUpItemData[]>([]);
  const [overdueList, setOverdueList] = useState<FollowUpItemData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [callModalData, setCallModalData] = useState<{
    isOpen: boolean;
    leadId: string;
    leadName: string;
    leadMobile: string;
  }>({
    isOpen: false,
    leadId: '',
    leadName: '',
    leadMobile: '',
  });

  const [rescheduleData, setRescheduleData] = useState<{
    isOpen: boolean;
    leadId: string;
    leadName: string;
    initialFollowUp?: {
      id: string;
      followUpDate: string;
      followUpTime: string;
      note: string;
    };
  }>({
    isOpen: false,
    leadId: '',
    leadName: '',
  });

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/follow-ups');
      if (res.ok) {
        const data = await res.json();
        setTodayList(data.todayFollowUps || []);
        setUpcomingList(data.upcomingFollowUps || []);
        setOverdueList(data.overdueFollowUps || []);
      }
    } catch (err) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const handleComplete = async (item: FollowUpItemData) => {
    try {
      const res = await fetch(`/api/follow-ups/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COMPLETE' }),
      });
      if (res.ok) {
        fetchFollowUps();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentList =
    activeTab === 'today'
      ? todayList
      : activeTab === 'upcoming'
      ? upcomingList
      : overdueList;

  return (
    <AppLayout title="Follow-ups" overdueCount={overdueList.length}>
      <div className="space-y-6 pb-16">
        {/* Overdue Warning Alert */}
        {overdueList.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Action Required: {overdueList.length} Overdue Follow-up{overdueList.length > 1 ? 's' : ''}</h3>
                <p className="text-xs text-rose-700">Follow-up schedule dates have passed. Please call or reschedule them immediately.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('overdue')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-xs shrink-0"
            >
              View Overdue
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex items-center gap-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'today'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Today's Follow-ups ({todayList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Upcoming ({upcomingList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue ({overdueList.length})</span>
          </button>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            Loading follow-up tasks...
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">
              No {activeTab} follow-ups
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              You are all caught up for this section!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map((item) => (
              <FollowUpCard
                key={item.id}
                item={item}
                isOverdue={activeTab === 'overdue'}
                onCall={(f) =>
                  setCallModalData({
                    isOpen: true,
                    leadId: f.lead.id,
                    leadName: f.lead.name,
                    leadMobile: f.lead.mobile,
                  })
                }
                onComplete={handleComplete}
                onReschedule={(f) =>
                  setRescheduleData({
                    isOpen: true,
                    leadId: f.lead.id,
                    leadName: f.lead.name,
                    initialFollowUp: {
                      id: f.id,
                      followUpDate: f.followUpDate,
                      followUpTime: f.followUpTime,
                      note: f.note,
                    },
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Call Modal */}
      <MarkCalledModal
        isOpen={callModalData.isOpen}
        onClose={() => setCallModalData((prev) => ({ ...prev, isOpen: false }))}
        leadId={callModalData.leadId}
        leadName={callModalData.leadName}
        leadMobile={callModalData.leadMobile}
        onCallRecorded={fetchFollowUps}
      />

      {/* Reschedule Modal */}
      <ScheduleFollowUpModal
        isOpen={rescheduleData.isOpen}
        onClose={() => setRescheduleData((prev) => ({ ...prev, isOpen: false }))}
        leadId={rescheduleData.leadId}
        leadName={rescheduleData.leadName}
        initialFollowUp={rescheduleData.initialFollowUp}
        isReschedule={true}
        onFollowUpScheduled={fetchFollowUps}
      />
    </AppLayout>
  );
}
