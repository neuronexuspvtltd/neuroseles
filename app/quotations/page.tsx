'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuotationTable, QuotationItem } from '@/components/quotations/QuotationTable';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { Search, Plus, Filter, Calendar, FileText } from 'lucide-react';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('all');

  // Modals & Action States
  const [deleteData, setDeleteData] = useState<QuotationItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        dateFilter,
      });

      const res = await fetch(`/api/quotations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuotations(data.quotations || []);
      }
    } catch (err) {
      console.error('Failed to fetch quotations', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuotations();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchQuotations]);

  const handleDuplicate = async (q: QuotationItem) => {
    try {
      const res = await fetch(`/api/quotations/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DUPLICATE' }),
      });
      if (res.ok) {
        fetchQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSent = async (q: QuotationItem) => {
    try {
      const res = await fetch(`/api/quotations/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_SENT' }),
      });
      if (res.ok) {
        fetchQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (q: QuotationItem) => {
    if (!confirm(`Mark Quotation ${q.quotationNumber} as ACCEPTED? This will automatically convert Lead ${q.lead.name} to a Client.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/quotations/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT' }),
      });
      if (res.ok) {
        fetchQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteData) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/quotations/${deleteData.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteData(null);
        fetchQuotations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const statusTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'DRAFT', label: 'Draft' },
    { id: 'SENT', label: 'Sent' },
    { id: 'VIEWED', label: 'Viewed' },
    { id: 'ACCEPTED', label: 'Accepted' },
    { id: 'REJECTED', label: 'Rejected' },
    { id: 'EXPIRED', label: 'Expired' },
    { id: 'REVISED', label: 'Revised' },
  ];

  return (
    <AppLayout title="Quotation Management">
      <div className="space-y-6 pb-16">
        {/* Top bar controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by quotation no., client, company, or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Actions & Quick Date Filter */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="this_month">This Month</option>
                </select>
              </div>

              <Link
                href="/quotations/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Quotation</span>
              </Link>
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
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quotation Table */}
        <QuotationTable
          quotations={quotations}
          loading={loading}
          onDuplicate={handleDuplicate}
          onMarkSent={handleMarkSent}
          onAccept={handleAccept}
          onDelete={(q) => setDeleteData(q)}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quotation Draft"
        description={`Are you sure you want to delete quotation ${deleteData?.quotationNumber}? This action cannot be undone.`}
        loading={deleting}
      />
    </AppLayout>
  );
}
