'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LeadTable, LeadItem } from '@/components/leads/LeadTable';
import { AddLeadModal } from '@/components/leads/AddLeadModal';
import { MarkCalledModal } from '@/components/leads/MarkCalledModal';
import { EditLeadModal } from '@/components/leads/EditLeadModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sort, setSort] = useState('newest');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<LeadItem | null>(null);
  const [deleteLeadData, setDeleteLeadData] = useState<LeadItem | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        sort,
      });

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  const handleDeleteConfirm = async () => {
    if (!deleteLeadData) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${deleteLeadData.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteLeadData(null);
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to delete lead', err);
    } finally {
      setDeleting(false);
    }
  };

  const filterTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'NEW', label: 'New' },
    { id: 'CALLED', label: 'Called' },
    { id: 'UNREACHABLE', label: 'Unreachable / Retry' },
    { id: 'INTERESTED', label: 'Interested' },
    { id: 'FOLLOW_UP', label: 'Follow-up' },
    { id: 'DEMO', label: 'Demo' },
    { id: 'QUOTATION', label: 'Quotation' },
    { id: 'NOT_INTERESTED', label: 'Not Interested' },
    { id: 'CONVERTED', label: 'Converted' },
  ];

  return (
    <AppLayout
      title="Leads"
      onAddLeadClick={() => setAddModalOpen(true)}
    >
      <div className="space-y-6 pb-12">
        {/* Controls: Search, Filter Tabs & Sort */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search leads by name, mobile, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="recently_contacted">Recently Contacted</option>
              </select>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100 no-scrollbar">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Table / Cards */}
        <LeadTable
          leads={leads}
          loading={loading}
          onMarkCalled={(lead) =>
            setCallModalData({
              isOpen: true,
              leadId: lead.id,
              leadName: lead.name,
              leadMobile: lead.mobile,
            })
          }
          onEdit={(lead) => setEditLead(lead)}
          onDelete={(lead) => setDeleteLeadData(lead)}
        />
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onLeadAdded={fetchLeads}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={!!editLead}
        onClose={() => setEditLead(null)}
        lead={editLead}
        onLeadUpdated={fetchLeads}
      />

      {/* Confirm Delete Lead Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteLeadData}
        onClose={() => setDeleteLeadData(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Lead Record"
        description={`Are you sure you want to delete lead ${deleteLeadData?.name}? All associated call history, follow-ups, and demo records will be permanently removed.`}
        loading={deleting}
      />

      {/* Mark Called Modal */}
      <MarkCalledModal
        isOpen={callModalData.isOpen}
        onClose={() => setCallModalData((prev) => ({ ...prev, isOpen: false }))}
        leadId={callModalData.leadId}
        leadName={callModalData.leadName}
        leadMobile={callModalData.leadMobile}
        onCallRecorded={fetchLeads}
      />
    </AppLayout>
  );
}
