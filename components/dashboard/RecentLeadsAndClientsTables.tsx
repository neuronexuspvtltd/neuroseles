'use client';

import React from 'react';
import { Users, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { formatPhoneNumber } from '@/lib/phoneUtils';

interface LeadItem {
  id: string;
  name: string;
  mobile: string;
  company?: string | null;
  source?: string | null;
  status: string;
  createdAt: string;
}

interface ClientItem {
  id: string;
  name: string;
  company?: string | null;
  mobile: string;
  status: string;
  clientSince: string;
  projects?: { id: string; name: string; status: string }[];
}

interface RecentLeadsAndClientsTablesProps {
  recentLeads: LeadItem[];
  recentClients: ClientItem[];
}

export const RecentLeadsAndClientsTables: React.FC<RecentLeadsAndClientsTablesProps> = ({
  recentLeads = [],
  recentClients = [],
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Leads Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Recent Leads
            </h3>
            <p className="text-xs text-slate-500">Latest captured prospects in CRM</p>
          </div>
          <Link
            href="/leads"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No leads created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Lead Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <Link href={`/leads/${lead.id}`} className="font-bold text-slate-900 hover:text-indigo-600 block truncate max-w-[140px]">
                        {lead.name}
                      </Link>
                      {lead.company && <span className="text-[10px] text-slate-400 block truncate">{lead.company}</span>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{formatPhoneNumber(lead.mobile)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                        {lead.source || 'Direct'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400 font-mono">
                      {format(parseISO(lead.createdAt), 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recently Converted Clients Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-600" /> Recently Converted Clients
            </h3>
            <p className="text-xs text-slate-500">Latest active clients & projects</p>
          </div>
          <Link
            href="/clients"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All Clients</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentClients.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No confirmed clients in workspace yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Client Name</th>
                  <th className="py-2.5 px-3">Mobile / Company</th>
                  <th className="py-2.5 px-3">Client Since</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentClients.map((client) => {
                  const proj = client.projects?.[0];
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <Link href={`/clients/${client.id}`} className="font-bold text-slate-900 hover:text-indigo-600 block truncate max-w-[140px]">
                          {client.name}
                        </Link>
                        {proj && <span className="text-[10px] text-indigo-600 block truncate font-medium">Proj: {proj.name}</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {formatPhoneNumber(client.mobile)}
                        {client.company && <span className="text-[10px] text-slate-400 block font-sans truncate">{client.company}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-slate-400 font-mono">
                        {format(parseISO(client.clientSince), 'dd MMM yyyy')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                          {client.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
