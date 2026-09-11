'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LeadTimeline } from '@/components/leads/LeadTimeline';
import { MarkCalledModal } from '@/components/leads/MarkCalledModal';
import { ScheduleFollowUpModal } from '@/components/leads/ScheduleFollowUpModal';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { getLeadWhatsAppLink } from '@/lib/whatsappUtils';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { format, parseISO } from 'date-fns';
import { EditLeadModal } from '@/components/leads/EditLeadModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import {
  PhoneCall,
  CalendarClock,
  Trophy,
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function LeadDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [requirements, setRequirements] = useState('');
  const [notes, setNotes] = useState('');
  const [savingRequirements, setSavingRequirements] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modals
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);

  const handleDeleteLead = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/leads';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const fetchLeadDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) {
        throw new Error('Lead not found');
      }
      const data = await res.json();
      setLead(data);
      setRequirements(data.initialRequirements || '');
      setNotes(data.notes || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load lead profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  const handleSaveRequirements = async () => {
    if (!id) return;
    setSavingRequirements(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialRequirements: requirements,
          notes,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        fetchLeadDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRequirements(false);
    }
  };

  const handleConvertClient = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to convert this lead to a Client?')) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CONVERT' }),
      });

      if (res.ok) {
        fetchLeadDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConverting(false);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchLeadDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Lead Profile">
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading lead profile...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !lead) {
    return (
      <AppLayout title="Lead Profile">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Lead Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">The requested lead does not exist or was removed.</p>
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Lead Profile: ${lead.name}`}>
      <div className="space-y-6 pb-16">
        {/* Back Link */}
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Leads</span>
        </Link>

        {/* Lead Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{lead.name}</h1>
              <StatusBadge status={lead.status} />
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-600 mt-1">
              <span>{formatPhoneNumber(lead.mobile)}</span>
              {lead.company && (
                <span className="font-sans text-slate-500">
                  Company: <strong className="text-slate-800">{lead.company}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppButton
              href={getLeadWhatsAppLink(lead)}
              title="Send WhatsApp Message"
              showText={true}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            />

            <button
              onClick={() => setCallModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Mark as Called</span>
            </button>

            <button
              onClick={() => setFollowUpModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <CalendarClock className="w-4 h-4" />
              <span>Schedule Follow-up</span>
            </button>

            {/* Quick Status Dropdown */}
            <div className="relative inline-block">
              <select
                value={lead.status}
                onChange={(e) => handleChangeStatus(e.target.value)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold focus:outline-none"
              >
                <option value="NEW">New</option>
                <option value="CALLED">Called</option>
                <option value="UNREACHABLE">Unreachable / Retry</option>
                <option value="INTERESTED">Interested</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="DEMO">Demo</option>
                <option value="QUOTATION">Quotation</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="CONVERTED">Converted</option>
              </select>
            </div>

            {lead.status !== 'CONVERTED' && (
              <button
                onClick={handleConvertClient}
                disabled={converting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Trophy className="w-4 h-4" />
                <span>Convert to Client</span>
              </button>
            )}

            <button
              onClick={() => setEditModalOpen(true)}
              className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
              title="Edit Lead"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDeleteModalOpen(true)}
              className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
              title="Delete Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Basic Info, Requirements, Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Company Name</span>
                    <span className="font-semibold text-slate-800">{lead.company || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Email Address</span>
                    <span className="font-semibold text-slate-800">{lead.email || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">City</span>
                    <span className="font-semibold text-slate-800">{lead.city || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Lead Source</span>
                    <span className="font-semibold text-slate-800">{lead.source || 'Website'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-slate-400 block">Created Date</span>
                    <span className="font-semibold text-slate-800">
                      {format(parseISO(lead.createdAt), 'dd MMMM yyyy, hh:mm a')}
                    </span>
                  </div>
                </div>

                {lead.convertedAt && (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block">Converted Date</span>
                      <span className="font-semibold">
                        {format(parseISO(lead.convertedAt), 'dd MMMM yyyy')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Initial Requirements */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Initial Requirements</h2>
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Enter client initial requirements..."
                className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveRequirements}
                  disabled={savingRequirements}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Requirements</span>
                </button>
              </div>
            </div>

            {/* Call History Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600" />
                  Call History ({lead.calls?.length || 0})
                </h2>
                <button
                  onClick={() => setCallModalOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  + Add Call
                </button>
              </div>

              {(!lead.calls || lead.calls.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No call logs recorded yet. Click "Mark as Called" to add a record.
                </p>
              ) : (
                <div className="space-y-3">
                  {lead.calls.map((call: any) => (
                    <div
                      key={call.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-indigo-700 font-bold">{call.callResult}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {call.callDate} {call.callTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Customer Response:</span>
                        <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {call.customerResponse}
                        </span>
                      </div>

                      {call.notes && (
                        <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 text-[11px]">
                          <strong className="text-slate-700">Notes: </strong>{call.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Scheduled Follow-ups & Activity Timeline */}
          <div className="space-y-6">
            {/* Follow-ups List */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Follow-ups ({lead.followUps?.length || 0})
                </h2>
                <button
                  onClick={() => setFollowUpModalOpen(true)}
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  + Schedule
                </button>
              </div>

              {(!lead.followUps || lead.followUps.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No follow-ups scheduled for this lead.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {lead.followUps.map((fu: any) => (
                    <div
                      key={fu.id}
                      className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-amber-900">
                        <span>{fu.followUpDate} ({fu.followUpTime})</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white border border-amber-300 rounded">
                          {fu.status}
                        </span>
                      </div>
                      <p className="text-slate-700">{fu.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Activity Timeline
              </h2>
              <LeadTimeline activities={lead.activities || []} />
            </div>
          </div>
        </div>
      </div>

      {/* Mark Called Modal */}
      <MarkCalledModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        leadId={lead.id}
        leadName={lead.name}
        leadMobile={lead.mobile}
        onCallRecorded={fetchLeadDetails}
      />

      {/* Schedule FollowUp Modal */}
      <ScheduleFollowUpModal
        isOpen={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        leadId={lead.id}
        leadName={lead.name}
        onFollowUpScheduled={fetchLeadDetails}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        lead={lead}
        onLeadUpdated={fetchLeadDetails}
      />

      {/* Confirm Delete Lead Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteLead}
        title="Delete Lead Record"
        description={`Are you sure you want to delete lead ${lead.name}? All associated call history, follow-ups, and demo records will be permanently removed.`}
        loading={deleting}
      />
    </AppLayout>
  );
}
