'use client';

import React, { Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuotationBuilder } from '@/components/quotations/QuotationBuilder';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewQuotationPage() {
  return (
    <AppLayout title="New Quotation">
      <div className="space-y-4">
        <Link
          href="/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations List</span>
        </Link>

        <Suspense
          fallback={
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium text-slate-500">Loading Quotation Builder...</p>
            </div>
          }
        >
          <QuotationBuilder />
        </Suspense>
      </div>
    </AppLayout>
  );
}
