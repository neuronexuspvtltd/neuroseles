'use client';

import React from 'react';
import { Filter, ArrowDown, TrendingUp, ChevronDown } from 'lucide-react';

interface ConversionFunnelStep {
  stage: string;
  count: number;
  percentOfTotal: number;
  percentOfPrevious: number;
}

interface ConversionFunnelSectionProps {
  funnel: ConversionFunnelStep[];
}

export const ConversionFunnelSection: React.FC<ConversionFunnelSectionProps> = ({ funnel = [] }) => {
  const funnelColors = [
    { bg: 'bg-blue-600', border: 'border-blue-700', text: 'text-white' },
    { bg: 'bg-indigo-600', border: 'border-indigo-700', text: 'text-white' },
    { bg: 'bg-purple-600', border: 'border-purple-700', text: 'text-white' },
    { bg: 'bg-cyan-600', border: 'border-cyan-700', text: 'text-white' },
    { bg: 'bg-teal-600', border: 'border-teal-700', text: 'text-white' },
    { bg: 'bg-emerald-600', border: 'border-emerald-700', text: 'text-white' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" /> Sales Conversion Funnel
          </h3>
          <p className="text-xs text-slate-500">
            Real step-by-step conversion progression from lead intake to confirmed client
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {funnel.map((step, idx) => {
          const color = funnelColors[idx % funnelColors.length];
          const widthPercent = Math.max(18, step.percentOfTotal);

          return (
            <div key={step.stage} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span>{step.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-900 font-extrabold">{step.count} leads</span>
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                    {step.percentOfTotal}% of total
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 rounded-xl overflow-hidden h-9 p-1 flex items-center">
                <div
                  style={{ width: `${widthPercent}%` }}
                  className={`${color.bg} h-full rounded-lg transition-all duration-500 flex items-center justify-between px-3 text-xs font-bold text-white shadow-2xs`}
                >
                  <span className="truncate">{step.stage} ({step.count})</span>
                  {idx > 0 && (
                    <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded backdrop-blur-xs font-mono shrink-0 ml-2">
                      {step.percentOfPrevious}% of prev
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
