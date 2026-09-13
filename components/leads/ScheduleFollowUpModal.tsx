'use client';

import React, { useState } from 'react';
import { X, CalendarClock, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface ScheduleFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  onFollowUpScheduled: () => void;
  initialFollowUp?: {
    id: string;
    followUpDate: string;
    followUpTime: string;
    note: string;
  };
  isReschedule?: boolean;
}

export const ScheduleFollowUpModal: React.FC<ScheduleFollowUpModalProps> = ({
  isOpen,
  onClose,
  leadId,
  leadName,
  onFollowUpScheduled,
  initialFollowUp,
  isReschedule = false,
}) => {
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [followUpDate, setFollowUpDate] = useState<string>(
    initialFollowUp?.followUpDate || tomorrowStr
  );
  const [followUpTime, setFollowUpTime] = useState<string>(
    initialFollowUp?.followUpTime || '16:00'
  );
  const [note, setNote] = useState<string>(initialFollowUp?.note || '');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate || !followUpTime || !note.trim()) {
      setError('Date, Time, and Note are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isReschedule && initialFollowUp) {
        // PATCH API route for reschedule
        const res = await fetch(`/api/follow-ups/${initialFollowUp.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RESCHEDULE',
            followUpDate,
            followUpTime,
            note: note.trim(),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to reschedule follow-up');
        }
      } else {
        // POST API route for new follow-up
        const res = await fetch('/api/follow-ups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            followUpDate,
            followUpTime,
            note: note.trim(),
            reminderEnabled,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to schedule follow-up');
        }
      }

      onFollowUpScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isReschedule ? 'Reschedule Follow-up' : 'Schedule Follow-up'}
              </h2>
              <p className="text-xs text-slate-500">{leadName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Follow-up Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Follow-up Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Follow-up Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Discuss website requirements and send pricing proposal"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reminder"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="reminder" className="text-xs text-slate-600 cursor-pointer">
              Enable in-app reminder notification
            </label>
          </div>

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
              className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isReschedule ? 'Reschedule' : 'Save Follow-up'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
