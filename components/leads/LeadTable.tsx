'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { getLeadWhatsAppLink } from '@/lib/whatsappUtils';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { format, parseISO } from 'date-fns';
import { Phone, Building2, Calendar, Eye, Pencil, Trash2 } from 'lucide-react';

export interface LeadItem {
  id: string;
  name: string;
  mobile: string;
  company: string | null;
  status: string;
  createdAt: string;
  email?: string | null;
  city?: string | null;
  source?: string | null;
  initialRequirements?: string | null;
  notes?: string | null;
  calls?: Array<{
    createdAt: string;
    callResult: string;
  }>;
  followUps?: Array<{
    followUpDate: string;
    followUpTime: string;
    status: string;
  }>;
  quotations?: any[];
}

interface LeadTableProps {
  leads: LeadItem[];
  loading?: boolean;
  onMarkCalled?: (lead: LeadItem) => void;
  onEdit?: (lead: LeadItem) => void;
  onDelete?: (lead: LeadItem) => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  loading = false,
  onMarkCalled,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Loading leads database...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No leads found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Try adjusting your search filters or click "+ Add Lead" to create a record.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="py-4 px-5">Lead Name</th>
              <th className="py-4 px-5">Mobile</th>
              <th className="py-4 px-5">Company</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5">Last Contact</th>
              <th className="py-4 px-5">Next Follow-up</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {leads.map((lead) => {
              const lastCall = lead.calls && lead.calls.length > 0 ? lead.calls[0] : null;
              const pendingFollowUp =
                lead.followUps && lead.followUps.length > 0 ? lead.followUps[0] : null;
              
              const initials = lead.name
                ? lead.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                : 'LD';

              // Determine Last Contact date accurately
              let lastContactFormatted = 'Never';
              if (lastCall && lastCall.createdAt) {
                try {
                  lastContactFormatted = format(parseISO(lastCall.createdAt), 'dd MMM yyyy');
                } catch (e) {
                  lastContactFormatted = 'Contacted';
                }
              } else if (lead.status && lead.status !== 'NEW') {
                const fallbackDate = lead.updatedAt || lead.createdAt;
                if (fallbackDate) {
                  try {
                    lastContactFormatted = format(parseISO(fallbackDate), 'dd MMM yyyy');
                  } catch (e) {
                    lastContactFormatted = 'Contacted';
                  }
                }
              }

              return (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="hover:text-teal-600 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <span className="truncate max-w-[160px]">{lead.name}</span>
                    </Link>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">
                    {formatPhoneNumber(lead.mobile)}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 font-medium">
                    {lead.company ? (
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{lead.company}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">
                    {lastContactFormatted !== 'Never' ? (
                      <span className="font-semibold text-slate-700">
                        {lastContactFormatted}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">Never</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-xs">
                    {pendingFollowUp ? (
                      <span className="font-bold text-amber-800 bg-amber-50/90 px-2.5 py-1 rounded-full border border-amber-200/80 text-[11px] inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        {pendingFollowUp.followUpDate}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <WhatsAppButton
                        href={getLeadWhatsAppLink(lead)}
                        title="Send WhatsApp Message"
                      />

                      {onMarkCalled && (
                        <button
                          onClick={() => onMarkCalled(lead)}
                          className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl border border-indigo-200/80 transition-all active:scale-95 cursor-pointer"
                          title="Record Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <Link
                        href={`/leads/${lead.id}`}
                        className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200/80 transition-all active:scale-95"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>

                      {onEdit && (
                        <button
                          onClick={() => onEdit(lead)}
                          className="p-2 text-teal-700 bg-teal-50 hover:bg-teal-100/80 rounded-xl border border-teal-200/80 transition-all active:scale-95 cursor-pointer"
                          title="Edit Lead"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          onClick={() => onDelete(lead)}
                          className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-xl border border-rose-200/80 transition-all active:scale-95 cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid */}
      <div className="md:hidden space-y-3">
        {leads.map((lead) => {
          const lastCall = lead.calls && lead.calls.length > 0 ? lead.calls[0] : null;
          const pendingFollowUp =
            lead.followUps && lead.followUps.length > 0 ? lead.followUps[0] : null;

          let lastContactFormatted = 'Never';
          if (lastCall && lastCall.createdAt) {
            try {
              lastContactFormatted = format(parseISO(lastCall.createdAt), 'dd MMM yyyy');
            } catch (e) {
              lastContactFormatted = 'Contacted';
            }
          } else if (lead.status && lead.status !== 'NEW') {
            const fallbackDate = lead.updatedAt || lead.createdAt;
            if (fallbackDate) {
              try {
                lastContactFormatted = format(parseISO(fallbackDate), 'dd MMM yyyy');
              } catch (e) {
                lastContactFormatted = 'Contacted';
              }
            }
          }

          return (
            <div
              key={lead.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-bold text-slate-900 text-base hover:text-indigo-600"
                  >
                    {lead.name}
                  </Link>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    {formatPhoneNumber(lead.mobile)}
                  </p>
                </div>
                <StatusBadge status={lead.status} />
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {lead.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Company: <strong className="text-slate-800">{lead.company}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Last Contact:{' '}
                    <strong className="text-slate-800 font-semibold">{lastContactFormatted}</strong>
                  </span>
                </div>
                {pendingFollowUp && (
                  <div className="flex items-center gap-2 text-amber-800">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Next Follow-up:{' '}
                      <strong>
                        {pendingFollowUp.followUpDate} ({pendingFollowUp.followUpTime})
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-1 flex items-center gap-2 justify-end">
                <WhatsAppButton
                  href={getLeadWhatsAppLink(lead)}
                  title="Send WhatsApp Message"
                />

                {onMarkCalled && (
                  <button
                    onClick={() => onMarkCalled(lead)}
                    className="p-2 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg"
                    title="Record Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}

                <Link
                  href={`/leads/${lead.id}`}
                  className="p-2 text-slate-700 bg-slate-100 border border-slate-200 rounded-lg"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </Link>

                {onEdit && (
                  <button
                    onClick={() => onEdit(lead)}
                    className="p-2 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg"
                    title="Edit Lead"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => onDelete(lead)}
                    className="p-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg"
                    title="Delete Lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
