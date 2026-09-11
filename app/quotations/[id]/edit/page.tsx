'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuotationBuilder } from '@/components/quotations/QuotationBuilder';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function EditQuotationPage() {
  const params = useParams();
  const id = params?.id as string;

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuotation() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/quotations/${id}`);
        if (!res.ok) throw new Error('Quotation not found');
        const data = await res.json();
        setQuotation(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load quotation');
      } finally {
        setLoading(false);
      }
    }
    fetchQuotation();
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Edit Quotation">
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading quotation details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !quotation) {
    return (
      <AppLayout title="Edit Quotation">
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8 space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Quotation Not Found</h2>
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

  return (
    <AppLayout title={`Edit ${quotation.quotationNumber}`}>
      <div className="space-y-4">
        <Link
          href={`/quotations/${quotation.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotation View</span>
        </Link>

        <QuotationBuilder existingQuotation={quotation} isEditMode={true} />
      </div>
    </AppLayout>
  );
}
