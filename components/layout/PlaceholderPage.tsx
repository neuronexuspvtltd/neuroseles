'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Sparkles, Construction, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon: Icon,
  features,
}) => {
  return (
    <AppLayout title={title}>
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
          <Icon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Phase 2 Module - Coming Soon
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">{title} Module</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">{description}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-left space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Architecture Ready For:
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {features.map((f, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/leads"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
        >
          Return to Leads Management
        </Link>
      </div>
    </AppLayout>
  );
};
