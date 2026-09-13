'use client';

import React, { useState } from 'react';
import { X, PhoneCall, Loader2, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface MarkCalledModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  leadMobile: string;
  onCallRecorded: () => void;
}

export const MarkCalledModal: React.FC<MarkCalledModalProps> = ({
  isOpen,
  onClose,
  leadId,
  leadName,
  leadMobile,
  onCallRecorded,
}) => {
  const [callResult, setCallResult] = useState<string>('Call Received');
  const [customerResponse, setCustomerResponse] = useState<string>('Called');
  const [callNotes, setCallNotes] = useState<string>('');

  // Follow-up details when 'Call Later' is selected
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [followUpDate, setFollowUpDate] = useState<string>(tomorrowStr);
  const [followUpTime, setFollowUpTime] = useState<string>('16:00');
  const [followUpNote, setFollowUpNote] = useState<string>('');

  // Not Interested details
  const [notInterestedReason, setNotInterestedReason] = useState<string>('Price');
  const [notInterestedNotes, setNotInterestedNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Record call
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          callResult,
          customerResponse: customerResponse === 'Called' ? 'General Call' : customerResponse,
          notes: callNotes,
          notInterestedReason: customerResponse === 'Not Interested' ? notInterestedReason : undefined,
          notInterestedNotes: customerResponse === 'Not Interested' ? notInterestedNotes : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record call');
      }

      // 2. If 'Call Later' (Follow-up) was chosen, schedule follow-up
      if (customerResponse === 'Call Later') {
        const fuRes = await fetch('/api/follow-ups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            followUpDate,
            followUpTime,
            note: followUpNote || callNotes || 'Scheduled follow-up call',
          }),
        });

        if (!fuRes.ok) {
          console.warn('Call recorded, but follow-up creation encountered an issue');
        }
      }

      onCallRecorded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Call Details</h2>
              <p className="text-xs text-slate-500">
                {leadName} ({leadMobile})
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Call Result */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Call Result <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Call Received', 'Call Not Received', 'Busy', 'Wrong Number'].map((result) => (
                <button
                  key={result}
                  type="button"
                  onClick={() => setCallResult(result)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                    callResult === result
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {result}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Response */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Customer Response / Stage <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'Called', label: 'Called (General)' },
                { id: 'Interested', label: 'Interested' },
                { id: 'Demo Required', label: 'Demo Required' },
                { id: 'Quotation Required', label: 'Quotation Required' },
                { id: 'Call Later', label: 'Call Later' },
                { id: 'Not Interested', label: 'Not Interested' },
                { id: 'Converted', label: 'Converted' },
              ].map((resp) => (
                <button
                  key={resp.id}
                  type="button"
                  onClick={() => setCustomerResponse(resp.id)}
                  className={`px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                    customerResponse === resp.id
                      ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {resp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up fields if Call Later is selected */}
          {customerResponse === 'Call Later' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Schedule Follow-up Call</span>
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
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
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
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-amber-900 mb-1">
                  Follow-up Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Discuss website requirements"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Not Interested fields if Not Interested is selected */}
          {customerResponse === 'Not Interested' && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
              <div className="font-semibold text-xs text-rose-900">
                Reason for Not Interested
              </div>

              <select
                value={notInterestedReason}
                onChange={(e) => setNotInterestedReason(e.target.value)}
                className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-rose-500"
              >
                <option value="Price">Price</option>
                <option value="Not Required">Not Required</option>
                <option value="Already Have Website">Already Have Website</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Other">Other</option>
              </select>

              <textarea
                rows={2}
                placeholder="Reason notes..."
                value={notInterestedNotes}
                onChange={(e) => setNotInterestedNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Call Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Call Notes / Details
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Spoke with client, discussed basic services..."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
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
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Call...</span>
                </>
              ) : (
                <span>Save Call</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
