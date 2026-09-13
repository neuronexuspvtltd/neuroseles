'use client';

import React from 'react';
import Link from 'next/link';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { getDemoWhatsAppLink } from '@/lib/whatsappUtils';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { Presentation, ExternalLink, Eye, Pencil, Trash2, Calendar } from 'lucide-react';

export interface DemoItem {
  id: string;
  leadId: string;
  demoDate: string;
  demoTime: string;
  duration?: string | null;
  status: string;
  demoLink?: string | null;
  meetingId?: string | null;
  password?: string | null;
  requirements?: string | null;
  notes?: string | null;
  assignedTo?: string | null;
  lead: {
    id: string;
    name: string;
    mobile: string;
    company: string | null;
    status: string;
    email?: string | null;
    city?: string | null;
    source?: string | null;
    initialRequirements?: string | null;
  };
}

interface DemoTableProps {
  demos: DemoItem[];
  loading?: boolean;
  onEdit?: (demo: DemoItem) => void;
  onDelete?: (demo: DemoItem) => void;
  onReschedule?: (demo: DemoItem) => void;
  onComplete?: (demo: DemoItem) => void;
}

export const DemoTable: React.FC<DemoTableProps> = ({
  demos,
  loading = false,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Loading demo schedule...</p>
      </div>
    );
  }

  if (demos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto text-purple-600 mb-3">
          <Presentation className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No demos found</h3>
        <p className="text-xs text-slate-500 mt-1">
          No product demonstrations match your current search filters.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">Scheduled</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">Completed</span>;
      case 'RESCHEDULED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">Rescheduled</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">Cancelled</span>;
      case 'NO_SHOW':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">No Show</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th className="py-4 px-5">Lead</th>
              <th className="py-4 px-5">Mobile</th>
              <th className="py-4 px-5">Company</th>
              <th className="py-4 px-5">Demo Date</th>
              <th className="py-4 px-5">Time</th>
              <th className="py-4 px-5">Demo Status</th>
              <th className="py-4 px-5">Assigned To</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {demos.map((demo) => {
              const initials = demo.lead.name
                ? demo.lead.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                : 'LD';

              return (
                <tr key={demo.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    <Link
                      href={`/demos/${demo.id}`}
                      className="hover:text-purple-600 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <span className="truncate max-w-[150px]">{demo.lead.name}</span>
                    </Link>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">
                    {formatPhoneNumber(demo.lead.mobile)}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 font-medium">
                    {demo.lead.company || '-'}
                  </td>
                  <td className="py-3.5 px-5 text-xs font-bold text-slate-900">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      {demo.demoDate}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs font-semibold text-slate-700">
                    {demo.demoTime}
                  </td>
                  <td className="py-3.5 px-5">
                    {getStatusBadge(demo.status)}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-500 font-medium">
                    {demo.assignedTo || 'Sales Rep'}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <WhatsAppButton
                      href={getDemoWhatsAppLink(demo)}
                      title="Send WhatsApp Demo Reminder"
                    />

                    {demo.demoLink && (
                      <a
                        href={demo.demoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                        title="Open Demo Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    
                    <Link
                      href={`/demos/${demo.id}`}
                      className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                      title="View Demo Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {onEdit && (
                      <button
                        onClick={() => onEdit(demo)}
                        className="p-2 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                        title="Edit Demo"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {onDelete && (
                      <button
                        onClick={() => onDelete(demo)}
                        className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                        title="Delete Demo"
                      >
                        <Trash2 className="w-4 h-4" />
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

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {demos.map((demo) => (
          <div
            key={demo.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <Link
                  href={`/demos/${demo.id}`}
                  className="font-bold text-slate-900 text-base hover:text-purple-600"
                >
                  {demo.lead.name}
                </Link>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  {formatPhoneNumber(demo.lead.mobile)}
                </p>
              </div>
              {getStatusBadge(demo.status)}
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  {demo.demoDate} at {demo.demoTime}
                </span>
                {demo.duration && <span className="text-[11px] text-slate-400">({demo.duration})</span>}
              </div>
              {demo.lead.company && (
                <div className="text-slate-600">
                  Company: <strong className="text-slate-800">{demo.lead.company}</strong>
                </div>
              )}
            </div>

            <div className="pt-1 flex items-center gap-2 justify-end">
              <WhatsAppButton
                href={getDemoWhatsAppLink(demo)}
                title="Send WhatsApp Demo Reminder"
              />

              {demo.demoLink && (
                <a
                  href={demo.demoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg"
                  title="Open Demo Link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              
              <Link
                href={`/demos/${demo.id}`}
                className="p-2 text-slate-700 bg-slate-100 border border-slate-200 rounded-lg"
                title="View Demo Details"
              >
                <Eye className="w-4 h-4" />
              </Link>

              {onEdit && (
                <button
                  onClick={() => onEdit(demo)}
                  className="p-2 text-purple-700 bg-purple-50 border border-purple-200 rounded-lg"
                  title="Edit Demo"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(demo)}
                  className="p-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg"
                  title="Delete Demo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
