'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, AlertCircle, ExternalLink, Loader2, CheckCircle2, UserCheck } from 'lucide-react';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadAdded,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    company: '',
    city: '',
    source: 'Website',
    assignedToId: '',
    initialRequirements: '',
    notes: '',
  });

  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [duplicateLead, setDuplicateLead] = useState<{
    id: string;
    name: string;
    mobile: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        const activeOnly = (data.users || []).filter((u: any) => u.status === 'ACTIVE');
        setActiveUsers(activeOnly);
      }
    } catch (err) {
      console.error('Failed to load assignable users:', err);
    }
  };

  if (!isOpen) return null;

  const handleMobileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, mobile: value }));
    setError(null);

    const norm = normalizePhoneNumber(value);
    if (norm.length >= 10) {
      setCheckingMobile(true);
      try {
        const res = await fetch('/api/leads/check-mobile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: value }),
        });
        const data = await res.json();
        if (data.exists) {
          setDuplicateLead({
            id: data.leadId,
            name: data.leadName,
            mobile: data.mobile,
          });
        } else {
          setDuplicateLead(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingMobile(false);
      }
    } else {
      setDuplicateLead(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      setError('Full Name and Mobile Number are required.');
      return;
    }

    if (duplicateLead) {
      setError('This mobile number already exists. Please view the existing lead.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({ error: null }));

      if (!res.ok) {
        if (res.status === 409 && data.existingLead) {
          setDuplicateLead(data.existingLead);
          setError('This mobile number already exists.');
        } else if (res.status === 401) {
          setError('Session expired. Please log in again to save leads.');
        } else {
          setError(data.error || `Server error (${res.status}). Failed to create lead.`);
        }
        return;
      }

      setSuccessMessage('Lead created successfully.');
      setTimeout(() => {
        onLeadAdded();
        onClose();
        setSuccessMessage(null);
        setFormData({
          name: '',
          mobile: '',
          email: '',
          company: '',
          city: '',
          source: 'Website',
          assignedToId: '',
          initialRequirements: '',
          notes: '',
        });
        setDuplicateLead(null);
      }, 500);
    } catch (err: any) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New Lead</h2>
            <p className="text-xs text-slate-500">Enter client information to create a new CRM lead</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Duplicate Mobile Banner */}
          {duplicateLead && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">This mobile number already exists.</p>
                  <p className="text-amber-700">Existing Lead: <span className="font-semibold">{duplicateLead.name}</span> ({duplicateLead.mobile})</p>
                </div>
              </div>
              <Link
                href={`/leads/${duplicateLead.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs shrink-0"
              >
                <span>View Existing Lead</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210 or +91 9876543210"
                  value={formData.mobile}
                  onChange={handleMobileChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    duplicateLead ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                />
                {checkingMobile && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company / Business Name
              </label>
              <input
                type="text"
                placeholder="e.g. ABC Hotel"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Lead Source */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Social Media">Social Media</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assigned To</span>
            </label>
            <select
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Unassigned</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) - {u.email}
                </option>
              ))}
            </select>
          </div>

          {/* Initial Requirements */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Requirements
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Client needs a responsive website with online booking system..."
              value={formData.initialRequirements}
              onChange={(e) => setFormData({ ...formData, initialRequirements: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="Internal notes or observations..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Boolean(duplicateLead)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Lead</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
