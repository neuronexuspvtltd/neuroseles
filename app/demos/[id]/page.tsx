'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarkDemoCompletedModal } from '@/components/demos/MarkDemoCompletedModal';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { getDemoWhatsAppLink } from '@/lib/whatsappUtils';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { format, parseISO } from 'date-fns';
import { EditDemoModal } from '@/components/demos/EditDemoModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import {
  Presentation,
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Clock,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  XCircle,
  UserX,
  FileEdit,
  History,
  Link as LinkIcon,
  Lock,
  Pencil,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export default function DemoDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [demo, setDemo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [requirements, setRequirements] = useState('');
  const [notes, setNotes] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [password, setPassword] = useState('');
  const [savingReqs, setSavingReqs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Modals
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteDemo = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/demos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/demos';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const fetchDemoDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/demos/${id}`);
      if (!res.ok) {
        throw new Error('Demo record not found');
      }
      const data = await res.json();
      setDemo(data);
      setRequirements(data.requirements || data.lead?.initialRequirements || '');
      setNotes(data.notes || '');
      setDemoLink(data.demoLink || '');
      setMeetingId(data.meetingId || '');
      setPassword(data.password || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load demo details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDemoDetails();
  }, [fetchDemoDetails]);

  const handleSaveRequirements = async () => {
    if (!id) return;
    setSavingReqs(true);
    try {
      const res = await fetch(`/api/demos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements,
          notes,
          demoLink,
          meetingId,
          password,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        fetchDemoDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReqs(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) return;

    try {
      const res = await fetch(`/api/demos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESCHEDULE',
          demoDate: rescheduleDate,
          demoTime: rescheduleTime,
          reason: rescheduleReason,
        }),
      });

      if (res.ok) {
        setIsRescheduling(false);
        fetchDemoDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (action: 'CANCEL' | 'NO_SHOW') => {
    const confirmMsg =
      action === 'CANCEL'
        ? 'Are you sure you want to cancel this demo?'
        : 'Mark this demo as No Show?';
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/demos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchDemoDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Demo Details">
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading demo details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !demo) {
    return (
      <AppLayout title="Demo Details">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Demo Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">The requested demo record does not exist.</p>
          <Link
            href="/demos"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Demos
          </Link>
        </div>
      </AppLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">Scheduled</span>;
      case 'COMPLETED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Completed</span>;
      case 'RESCHEDULED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Rescheduled</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Cancelled</span>;
      case 'NO_SHOW':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">No Show</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <AppLayout title={`Demo: ${demo.lead.name}`}>
      <div className="space-y-6 pb-16">
        {/* Back Link */}
        <Link
          href="/demos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Demos</span>
        </Link>

        {/* Demo Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{demo.lead.name}</h1>
              {getStatusBadge(demo.status)}
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-600 mt-1">
              <span>{formatPhoneNumber(demo.lead.mobile)}</span>
              {demo.lead.company && (
                <span className="font-sans text-slate-500">
                  Company: <strong className="text-slate-800">{demo.lead.company}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppButton
              href={getDemoWhatsAppLink(demo)}
              title="Send WhatsApp Demo Reminder"
              showText={true}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors"
            />

            {demo.status === 'SCHEDULED' && (
              <>
                <button
                  onClick={() => setIsRescheduling(!isRescheduling)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reschedule</span>
                </button>

                <button
                  onClick={() => setCompleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Completed</span>
                </button>

                <button
                  onClick={() => handleAction('NO_SHOW')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Mark No Show</span>
                </button>

                <button
                  onClick={() => handleAction('CANCEL')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Demo</span>
                </button>
              </>
            )}

            <button
              onClick={() => setEditModalOpen(true)}
              className="p-2 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
              title="Edit Demo"
            >
              <Pencil className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDeleteModalOpen(true)}
              className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
              title="Delete Demo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reschedule inline drawer */}
        {isRescheduling && (
          <form
            onSubmit={handleRescheduleSubmit}
            className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-3 animate-in fade-in"
          >
            <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              Reschedule Demo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-amber-900 font-semibold mb-1">New Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2 border border-amber-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-amber-900 font-semibold mb-1">New Time *</label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-2 border border-amber-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-amber-900 font-semibold mb-1">Reason for Reschedule</label>
                <input
                  type="text"
                  placeholder="e.g. Client requested time change"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full p-2 border border-amber-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRescheduling(false)}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Save New Schedule
              </button>
            </div>
          </form>
        )}

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Client Info, Demo Info, Meeting Credentials, Requirements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Client Information</h2>
                <Link
                  href={`/leads/${demo.lead.id}`}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>View Lead Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Full Name</span>
                  <span className="font-semibold text-slate-900">{demo.lead.name}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Mobile Number</span>
                  <span className="font-semibold font-mono text-slate-900">{formatPhoneNumber(demo.lead.mobile)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Company Name</span>
                  <span className="font-semibold text-slate-900">{demo.lead.company || '-'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Email Address</span>
                  <span className="font-semibold text-slate-900">{demo.lead.email || '-'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">City</span>
                  <span className="font-semibold text-slate-900">{demo.lead.city || '-'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Lead Source</span>
                  <span className="font-semibold text-slate-900">{demo.lead.source || 'Website'}</span>
                </div>
              </div>
            </div>

            {/* Demo Information Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Demo Schedule Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Demo Date</span>
                  <span className="font-bold text-purple-900">{demo.demoDate}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Demo Time</span>
                  <span className="font-bold text-purple-900">{demo.demoTime}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Duration</span>
                  <span className="font-semibold text-slate-800">{demo.duration || '30 mins'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Assigned To</span>
                  <span className="font-semibold text-slate-800">{demo.assignedTo || 'Sales Representative'}</span>
                </div>
              </div>
            </div>

            {/* Meeting Credentials Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                Meeting Information
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Demo Meeting Link</span>
                  {demoLink ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={demoLink}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                      />
                      <a
                        href={demoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-xs inline-flex items-center gap-1 shrink-0"
                      >
                        <span>Open Demo Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No meeting link added.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-slate-400 block">Meeting ID</span>
                    <span className="font-semibold font-mono text-slate-800">{meetingId || '-'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Passcode / Password</span>
                    <span className="font-semibold font-mono text-slate-800">{password || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Client Demo Requirements</h2>
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
              <textarea
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Enter client demo requirements..."
                className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveRequirements}
                  disabled={savingReqs}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Requirements & Info</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Demo Notes & Demo History */}
          <div className="space-y-6">
            {/* Demo Notes */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Demo Feedback & Notes
              </h2>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes during or after the demo..."
                className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveRequirements}
                  disabled={savingReqs}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Demo History Section (Multiple Demos per Lead!) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-600" />
                Demo History ({demo.lead?.demos?.length || 1})
              </h2>

              {(!demo.lead?.demos || demo.lead.demos.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-4">No previous demos.</p>
              ) : (
                <div className="space-y-2.5">
                  {demo.lead.demos.map((d: any, idx: number) => (
                    <div
                      key={d.id}
                      className={`p-3 rounded-lg border text-xs space-y-1 ${
                        d.id === demo.id
                          ? 'bg-purple-50/70 border-purple-300 font-medium'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Demo #{demo.lead.demos.length - idx}: {d.demoDate} ({d.demoTime})
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white border rounded font-semibold">
                          {d.status}
                        </span>
                      </div>
                      {d.demoResult && (
                        <p className="text-slate-600 text-[11px]">
                          Result: <strong className="text-slate-800">{d.demoResult}</strong>
                        </p>
                      )}
                      {d.id !== demo.id && (
                        <Link
                          href={`/demos/${d.id}`}
                          className="text-[11px] font-semibold text-purple-600 hover:underline block pt-1"
                        >
                          View Record
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mark Completed Modal */}
      <MarkDemoCompletedModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        demoId={demo.id}
        leadName={demo.lead.name}
        onDemoCompleted={fetchDemoDetails}
      />

      {/* Edit Demo Modal */}
      <EditDemoModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        demo={demo}
        onDemoUpdated={fetchDemoDetails}
      />

      {/* Confirm Delete Demo Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteDemo}
        title="Delete Demo Record"
        description={`Are you sure you want to delete the demo scheduled for ${demo?.lead?.name} on ${demo?.demoDate}?`}
        loading={deleting}
      />
    </AppLayout>
  );
}
