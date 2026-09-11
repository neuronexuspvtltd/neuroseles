'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface MarkDemoCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoId: string;
  leadName: string;
  onDemoCompleted: () => void;
}

export const MarkDemoCompletedModal: React.FC<MarkDemoCompletedModalProps> = ({
  isOpen,
  onClose,
  demoId,
  leadName,
  onDemoCompleted,
}) => {
  const [demoResult, setDemoResult] = useState<string>('Wants Quotation');
  const [notes, setNotes] = useState<string>('');

  // Follow-up inputs if Needs Follow-up is selected
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [followUpDate, setFollowUpDate] = useState<string>(tomorrowStr);
  const [followUpTime, setFollowUpTime] = useState<string>('16:00');
  const [followUpNote, setFollowUpNote] = useState<string>('');

  // Not Interested reason if Not Interested is selected
  const [notInterestedReason, setNotInterestedReason] = useState<string>('Price');
  const [notInterestedNotes, setNotInterestedNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demoResult === 'Converted') {
      if (!confirm('Are you sure you want to convert this lead into a client?')) {
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/demos/${demoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE',
          demoResult,
          notes,
          followUpDate: demoResult === 'Needs Follow-up' ? followUpDate : undefined,
          followUpTime: demoResult === 'Needs Follow-up' ? followUpTime : undefined,
          followUpNote: demoResult === 'Needs Follow-up' ? followUpNote : undefined,
          notInterestedReason: demoResult === 'Not Interested' ? notInterestedReason : undefined,
          notInterestedNotes: demoResult === 'Not Interested' ? notInterestedNotes : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete demo');
      }

      onDemoCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mark Demo as Completed</h2>
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

          {/* Demo Result Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Demo Result / Next Action <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Interested',
                'Wants Quotation',
                'Needs Follow-up',
                'Not Interested',
                'Converted',
                'Other',
              ].map((result) => (
                <button
                  key={result}
                  type="button"
                  onClick={() => setDemoResult(result)}
                  className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                    demoResult === result
                      ? 'bg-emerald-600 border-emerald-600 text-white font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {result}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Section if Needs Follow-up is selected */}
          {demoResult === 'Needs Follow-up' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Schedule Follow-up Call (Phase 1 Follow-up System)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-amber-900 mb-1">
                    Follow-up Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-amber-900 mb-1">
                    Follow-up Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-amber-900 mb-1">
                  Follow-up Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call after 2 days to discuss demo feedback"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
          )}

          {/* Not Interested reason if Not Interested is selected */}
          {demoResult === 'Not Interested' && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
              <div className="font-semibold text-xs text-rose-900">
                Reason for Not Interested
              </div>
              <select
                value={notInterestedReason}
                onChange={(e) => setNotInterestedReason(e.target.value)}
                className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-white"
              >
                <option value="Price">Price</option>
                <option value="Features">Features</option>
                <option value="Not Required">Not Required</option>
                <option value="Changed Plan">Changed Plan</option>
                <option value="Competitor">Competitor</option>
                <option value="Other">Other</option>
              </select>
              <textarea
                rows={2}
                placeholder="Reason notes..."
                value={notInterestedNotes}
                onChange={(e) => setNotInterestedNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-white"
              />
            </div>
          )}

          {/* Post-Demo Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Demo Feedback / Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Client liked the design, asked about hosting & maintenance. Requested formal quotation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
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
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Completing...</span>
                </>
              ) : (
                <span>Complete Demo</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
