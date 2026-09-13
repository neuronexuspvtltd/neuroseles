'use client';

import React from 'react';
import Link from 'next/link';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { getQuotationWhatsAppLink } from '@/lib/whatsappUtils';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import {
  FileText,
  Eye,
  Pencil,
  Copy,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Building2,
  Trash2,
} from 'lucide-react';

export interface QuotationItem {
  id: string;
  quotationNumber: string;
  leadId: string;
  projectTitle: string;
  quotationDate: string;
  validUntil: string;
  status: string;
  grandTotal: number;
  currency: string;
  revisionNumber: number;
  parentQuotationId?: string | null;
  lead: {
    id: string;
    name: string;
    mobile: string;
    company: string | null;
    email?: string | null;
  };
}

interface QuotationTableProps {
  quotations: QuotationItem[];
  loading?: boolean;
  onEdit?: (quotation: QuotationItem) => void;
  onDuplicate?: (quotation: QuotationItem) => void;
  onMarkSent?: (quotation: QuotationItem) => void;
  onAccept?: (quotation: QuotationItem) => void;
  onReject?: (quotation: QuotationItem) => void;
  onDelete?: (quotation: QuotationItem) => void;
}

export const QuotationTable: React.FC<QuotationTableProps> = ({
  quotations,
  loading = false,
  onEdit,
  onDuplicate,
  onMarkSent,
  onAccept,
  onReject,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Loading quotations list...</p>
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600 mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No quotations found</h3>
        <p className="text-xs text-slate-500 mt-1">
          No proposals or quotations match your current search filters.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">Draft</span>;
      case 'SENT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">Sent</span>;
      case 'VIEWED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">Viewed</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">Accepted</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">Rejected</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">Expired</span>;
      case 'REVISED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/80 shadow-2xs">Revised</span>;
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
              <th className="py-4 px-5">Quotation No.</th>
              <th className="py-4 px-5">Client</th>
              <th className="py-4 px-5">Project Title</th>
              <th className="py-4 px-5">Created Date</th>
              <th className="py-4 px-5">Valid Until</th>
              <th className="py-4 px-5 text-right">Total Amount</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {quotations.map((q) => {
              const initials = q.lead.name
                ? q.lead.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                : 'QT';

              return (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-5 font-mono font-bold text-teal-700 text-xs">
                    <Link href={`/quotations/${q.id}`} className="hover:underline flex items-center gap-1.5">
                      <span>{q.quotationNumber}</span>
                      {q.revisionNumber > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-cyan-100 text-cyan-800 rounded-md font-sans uppercase">
                          R{q.revisionNumber}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    <Link href={`/leads/${q.lead.id}`} className="hover:text-teal-600 transition-colors flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                        {initials}
                      </div>
                      <span className="truncate max-w-[140px]">{q.lead.name}</span>
                    </Link>
                    {q.lead.company && (
                      <span className="block text-[11px] font-medium text-slate-400 pl-9.5">{q.lead.company}</span>
                    )}
                  </td>
                <td className="py-3.5 px-4 text-xs font-medium text-slate-700 max-w-xs truncate">
                  {q.projectTitle}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-600">
                  {q.quotationDate}
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-600">
                  {q.validUntil}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-xs">
                  ₹{q.grandTotal.toLocaleString('en-IN')}
                </td>
                <td className="py-3.5 px-4">
                  {getStatusBadge(q.status)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <WhatsAppButton
                      href={getQuotationWhatsAppLink(q)}
                      title="Send Quotation PDF via WhatsApp"
                    />

                    <Link
                      href={`/quotations/${q.id}`}
                      className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                      title="View Quotation Document"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {q.status === 'DRAFT' && onEdit && (
                      <Link
                        href={`/quotations/${q.id}/edit`}
                        className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                        title="Edit Draft"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    )}

                    {onDuplicate && (
                      <button
                        onClick={() => onDuplicate(q)}
                        className="p-2 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                        title="Duplicate Quotation"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}

                    {q.status === 'DRAFT' && onMarkSent && (
                      <button
                        onClick={() => onMarkSent(q)}
                        className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                        title="Mark as Sent"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}

                    {q.status !== 'ACCEPTED' && onAccept && (
                      <button
                        onClick={() => onAccept(q)}
                        className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                        title="Mark Accepted & Convert Client"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {onDelete && q.status === 'DRAFT' && (
                      <button
                        onClick={() => onDelete(q)}
                        className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                        title="Delete Quotation"
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {quotations.map((q) => (
          <div
            key={q.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-700 block">
                  {q.quotationNumber}
                </span>
                <Link
                  href={`/quotations/${q.id}`}
                  className="font-bold text-slate-900 text-base hover:text-indigo-600 block mt-0.5"
                >
                  {q.lead.name}
                </Link>
                <p className="text-xs text-slate-500 font-medium">{q.projectTitle}</p>
              </div>
              {getStatusBadge(q.status)}
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <strong className="text-slate-900 font-bold">₹{q.grandTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Valid Until:</span>
                <span>{q.validUntil}</span>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2 justify-end">
              <WhatsAppButton href={getQuotationWhatsAppLink(q)} title="Send Quotation PDF via WhatsApp" />

              <Link
                href={`/quotations/${q.id}`}
                className="p-2 text-slate-700 bg-slate-100 border border-slate-200 rounded-lg"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </Link>

              {onDuplicate && (
                <button
                  onClick={() => onDuplicate(q)}
                  className="p-2 text-purple-700 bg-purple-50 border border-purple-200 rounded-lg"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
