'use client';

import React, { useState, useEffect } from 'react';
import { X, Presentation, Loader2, Link as LinkIcon, Lock, Key, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface ScheduleDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLead?: {
    id: string;
    name: string;
    mobile: string;
    company: string | null;
    initialRequirements?: string | null;
  };
  onDemoScheduled: () => void;
}

export const ScheduleDemoModal: React.FC<ScheduleDemoModalProps> = ({
  isOpen,
  onClose,
  initialLead,
  onDemoScheduled,
}) => {
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const [leadId, setLeadId] = useState<string>(initialLead?.id || '');
  const [demoDate, setDemoDate] = useState<string>(tomorrowStr);
  const [demoTime, setDemoTime] = useState<string>('16:00');
  const [duration, setDuration] = useState<string>('30 mins');
  const [demoLink, setDemoLink] = useState<string>('');
  const [meetingId, setMeetingId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [requirements, setRequirements] = useState<string>(
    initialLead?.initialRequirements || ''
  );
  const [notes, setNotes] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>('15_MINS');

  // Lead search when initialLead is not provided
  const [leadOptions, setLeadOptions] = useState<any[]>([]);
  const [leadSearch, setLeadSearch] = useState<string>('');
  const [loadingLeads, setLoadingLeads] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialLead) {
      setLeadId(initialLead.id);
      if (initialLead.initialRequirements) {
        setRequirements(initialLead.initialRequirements);
      }
    } else if (isOpen) {
      // Fetch available leads for selection
      setLoadingLeads(true);
      fetch('/api/leads?limit=100')
        .then((res) => res.json())
        .then((data) => {
          setLeadOptions(data.leads || []);
          if (data.leads && data.leads.length > 0) {
            setLeadId(data.leads[0].id);
            setRequirements(data.leads[0].initialRequirements || '');
          }
        })
        .catch(console.error)
        .finally(() => setLoadingLeads(false));
    }
  }, [initialLead, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) {
      setError('Please select a lead.');
      return;
    }
    if (!demoDate || !demoTime) {
      setError('Demo Date and Time are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/demos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          demoDate,
          demoTime,
          duration,
          demoLink: demoLink.trim(),
          meetingId: meetingId.trim(),
          password: password.trim(),
          requirements: requirements.trim(),
          notes: notes.trim(),
          reminderEnabled,
          reminderTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule demo');
      }

      onDemoScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Schedule Product Demo</h2>
              <p className="text-xs text-slate-500">
                {initialLead
                  ? `${initialLead.name} (${initialLead.mobile})`
                  : 'Select an existing lead to schedule a demo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Lead Selection (if not fixed initialLead) */}
          {!initialLead ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Lead <span className="text-rose-500">*</span>
              </label>
              {loadingLeads ? (
                <p className="text-xs text-slate-400">Loading leads list...</p>
              ) : (
                <select
                  required
                  value={leadId}
                  onChange={(e) => {
                    setLeadId(e.target.value);
                    const selected = leadOptions.find((l) => l.id === e.target.value);
                    if (selected && selected.initialRequirements) {
                      setRequirements(selected.initialRequirements);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500"
                >
                  {leadOptions.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.mobile} {l.company ? `(${l.company})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Lead Name</span>
                <span className="font-bold text-slate-900">{initialLead.name} ({initialLead.mobile})</span>
              </div>
              {initialLead.company && (
                <span className="text-slate-600 bg-white px-2 py-1 rounded border border-purple-200 font-semibold">
                  {initialLead.company}
                </span>
              )}
            </div>
          )}

          {/* Date & Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Demo Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={demoDate}
                onChange={(e) => setDemoDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Demo Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={demoTime}
                onChange={(e) => setDemoTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="15 mins">15 minutes</option>
                <option value="30 mins">30 minutes</option>
                <option value="45 mins">45 minutes</option>
                <option value="60 mins">60 minutes</option>
              </select>
            </div>
          </div>

          {/* Meeting Info Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Meeting Credentials (Optional)</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Meeting Link (Google Meet / Zoom / Teams URL)
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/..."
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Meeting ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123 456 7890"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Passcode / Password
                </label>
                <input
                  type="text"
                  placeholder="e.g. abc123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Client Requirements Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client Demo Requirements
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Need hotel website demo showing room booking, photo gallery, admin panel, WhatsApp chat..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Demo Notes
            </label>
            <textarea
              rows={2}
              placeholder="Pre-demo observations or preparations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Reminder settings */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="demoReminder"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="demoReminder" className="font-semibold text-slate-700 cursor-pointer">
                In-App Demo Reminder
              </label>
            </div>

            {reminderEnabled && (
              <select
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded bg-white font-medium text-slate-700"
              >
                <option value="15_MINS">15 minutes before</option>
                <option value="30_MINS">30 minutes before</option>
                <option value="1_HOUR">1 hour before</option>
                <option value="1_DAY">1 day before</option>
              </select>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>Schedule Demo</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
