'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DemoTable, DemoItem } from '@/components/demos/DemoTable';
import { ScheduleDemoModal } from '@/components/demos/ScheduleDemoModal';
import { MarkDemoCompletedModal } from '@/components/demos/MarkDemoCompletedModal';
import { EditDemoModal } from '@/components/demos/EditDemoModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { Search, Plus, Filter, Calendar } from 'lucide-react';

export default function DemosPage() {
  const [demos, setDemos] = useState<DemoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('all');

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editDemo, setEditDemo] = useState<DemoItem | null>(null);
  const [deleteDemoData, setDeleteDemoData] = useState<DemoItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [completeModalData, setCompleteModalData] = useState<{
    isOpen: boolean;
    demoId: string;
    leadName: string;
  }>({
    isOpen: false,
    demoId: '',
    leadName: '',
  });

  const fetchDemos = useCallback(async () => {
    setLoading(true);
    try {
      const clientToday = new Date().toLocaleDateString('sv');
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        dateFilter,
        clientDate: clientToday,
      });

      const res = await fetch(`/api/demos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDemos(data.demos || []);
      }
    } catch (err) {
      console.error('Failed to fetch demos', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDemos();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchDemos]);

  const handleDeleteConfirm = async () => {
    if (!deleteDemoData) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/demos/${deleteDemoData.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteDemoData(null);
        fetchDemos();
      }
    } catch (err) {
      console.error('Failed to delete demo', err);
    } finally {
      setDeleting(false);
    }
  };

  const statusTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'TODAY', label: 'Today' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'RESCHEDULED', label: 'Rescheduled' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'NO_SHOW', label: 'No Show' },
  ];

  return (
    <AppLayout
      title="Demo Management"
      onAddLeadClick={undefined}
    >
      <div className="space-y-6 pb-16">
        {/* Top bar controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search demos by lead name, mobile, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Actions & Quick Date Filter */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this_week">This Week</option>
                </select>
              </div>

              <button
                onClick={() => setScheduleModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Demo</span>
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100 no-scrollbar">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Table / Cards */}
        <DemoTable
          demos={demos}
          loading={loading}
          onEdit={(demo) => setEditDemo(demo)}
          onDelete={(demo) => setDeleteDemoData(demo)}
          onComplete={(demo) =>
            setCompleteModalData({
              isOpen: true,
              demoId: demo.id,
              leadName: demo.lead.name,
            })
          }
        />
      </div>

      {/* Schedule Demo Modal */}
      <ScheduleDemoModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onDemoScheduled={fetchDemos}
      />

      {/* Edit Demo Modal */}
      <EditDemoModal
        isOpen={!!editDemo}
        onClose={() => setEditDemo(null)}
        demo={editDemo}
        onDemoUpdated={fetchDemos}
      />

      {/* Confirm Delete Demo Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteDemoData}
        onClose={() => setDeleteDemoData(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Demo Record"
        description={`Are you sure you want to delete the demo scheduled for ${deleteDemoData?.lead.name} on ${deleteDemoData?.demoDate}?`}
        loading={deleting}
      />

      {/* Mark Completed Modal */}
      <MarkDemoCompletedModal
        isOpen={completeModalData.isOpen}
        onClose={() => setCompleteModalData((prev) => ({ ...prev, isOpen: false }))}
        demoId={completeModalData.demoId}
        leadName={completeModalData.leadName}
        onDemoCompleted={fetchDemos}
      />
    </AppLayout>
  );
}
