'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuotationDocument } from '@/components/quotations/QuotationDocument';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { getQuotationWhatsAppLink } from '@/lib/whatsappUtils';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { downloadQuotationPDF, handleShareQuotationWhatsApp } from '@/lib/pdfUtils';
import {
  ArrowLeft,
  FileText,
  Printer,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Pencil,
  Trash2,
  History,
  AlertCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Price');
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchQuotationDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${id}`);
      if (!res.ok) {
        throw new Error('Quotation record not found');
      }
      const data = await res.json();
      setQuotation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuotationDetails();
  }, [fetchQuotationDetails]);

  // Actions
  const handleAction = async (action: string, extraBody?: any) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraBody }),
      });

      if (res.ok) {
        const data = await res.json();
        if (action === 'REVISE' && data.newRevision?.id) {
          router.push(`/quotations/${data.newRevision.id}`);
        } else if (action === 'DUPLICATE' && data.id) {
          router.push(`/quotations/${data.id}`);
        } else {
          fetchQuotationDetails();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptQuotation = () => {
    if (confirm(`Accept Quotation ${quotation?.quotationNumber}? This will automatically convert Lead ${quotation?.lead?.name} to a Client.`)) {
      handleAction('ACCEPT');
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction('REJECT', { rejectionReason, rejectionNotes });
    setRejectModalOpen(false);
  };

  const handleDeleteQuotation = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/quotations');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;
    const filename = `Quotation_${quotation.quotationNumber || 'Document'}.pdf`;
    const success = await downloadQuotationPDF('quotation-document-container', filename);
    if (!success) {
      window.print();
    }
  };

  const handleWhatsAppShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!quotation) return;
    const waUrl = getQuotationWhatsAppLink(quotation);
    await handleShareQuotationWhatsApp(quotation, waUrl);
  };

  if (loading) {
    return (
      <AppLayout title="Quotation Details">
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading quotation document...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !quotation) {
    return (
      <AppLayout title="Quotation Details">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8 space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Quotation Not Found</h2>
          <p className="text-xs text-slate-500">The requested quotation record does not exist.</p>
          <Link
            href="/quotations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotations
          </Link>
        </div>
      </AppLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">Draft</span>;
      case 'SENT':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Sent</span>;
      case 'VIEWED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">Viewed</span>;
      case 'ACCEPTED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Accepted 🎉</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      case 'EXPIRED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Expired</span>;
      case 'REVISED':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">Revised</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <AppLayout title={`Quotation ${quotation.quotationNumber}`}>
      <div className="space-y-6 pb-20 no-print">
        {/* Back Link */}
        <Link
          href="/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Quotations</span>
        </Link>

        {/* Quotation Header Action Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black font-mono text-indigo-900">{quotation.quotationNumber}</h1>
              {getStatusBadge(quotation.status)}
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mt-1">
              <span>Client: <strong className="text-slate-900">{quotation.lead.name}</strong></span>
              {quotation.lead.company && (
                <span>Company: <strong className="text-slate-800">{quotation.lead.company}</strong></span>
              )}
              <span className="font-mono text-indigo-700 font-bold">
                ₹{quotation.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <WhatsAppButton
              href={getQuotationWhatsAppLink(quotation)}
              onClick={handleWhatsAppShare}
              title="Auto-download PDF & Send on WhatsApp"
              showText={true}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            />

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
              title="Download High-Res PDF"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print</span>
            </button>

            {quotation.status === 'DRAFT' && (
              <>
                <Link
                  href={`/quotations/${quotation.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Draft</span>
                </Link>

                <button
                  onClick={() => handleAction('MARK_SENT')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-semibold border border-indigo-200"
                >
                  <Send className="w-4 h-4" />
                  <span>Mark Sent</span>
                </button>
              </>
            )}

            {quotation.status !== 'ACCEPTED' && (
              <button
                onClick={handleAcceptQuotation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Accepted</span>
              </button>
            )}

            {quotation.status !== 'REJECTED' && quotation.status !== 'ACCEPTED' && (
              <button
                onClick={() => setRejectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200"
              >
                <XCircle className="w-4 h-4" />
                <span>Mark Rejected</span>
              </button>
            )}

            <button
              onClick={() => handleAction('REVISE')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-lg text-xs font-semibold border border-cyan-200 transition-colors"
              title="Create Revision (QT-0001-R1)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Revise</span>
            </button>

            <button
              onClick={() => handleAction('DUPLICATE')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold border border-purple-200 transition-colors"
              title="Duplicate into New Quotation"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            {quotation.status === 'DRAFT' && (
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                title="Delete Draft"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Revision Banner if applicable */}
        {(quotation.parentQuotation || (quotation.revisions && quotation.revisions.length > 0)) && (
          <div className="bg-cyan-50/80 border border-cyan-200 rounded-xl p-4 text-xs text-cyan-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <History className="w-4 h-4 text-cyan-700" />
              Quotation Revision History
            </div>
            {quotation.parentQuotation && (
              <p>
                Revised from original quotation:{' '}
                <Link href={`/quotations/${quotation.parentQuotation.id}`} className="font-bold underline">
                  {quotation.parentQuotation.quotationNumber}
                </Link>
              </p>
            )}
            {quotation.revisions && quotation.revisions.length > 0 && (
              <p>
                Newer Revisions available:{' '}
                {quotation.revisions.map((r: any) => (
                  <Link key={r.id} href={`/quotations/${r.id}`} className="font-bold underline ml-2">
                    {r.quotationNumber} ({r.status})
                  </Link>
                ))}
              </p>
            )}
          </div>
        )}

        {/* Printable Quotation Document */}
        <QuotationDocument quotation={quotation} />
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Mark Quotation as Rejected</h3>
              <button onClick={() => setRejectModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rejection Reason</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Price">Price / Too Expensive</option>
                  <option value="Budget">Over Budget</option>
                  <option value="Selected Competitor">Selected Competitor</option>
                  <option value="Project Cancelled">Project Cancelled / On Hold</option>
                  <option value="Not Required">Requirement Changed</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Notes</label>
                <textarea
                  rows={3}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="Enter feedback or context provided by client..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 font-semibold text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-lg shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Draft Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteQuotation}
        title="Delete Quotation"
        description={`Are you sure you want to delete quotation ${quotation.quotationNumber}?`}
        loading={deleting}
      />
    </AppLayout>
  );
}
