'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddClientModal } from '@/components/clients/AddClientModal';
import { EditClientModal } from '@/components/clients/EditClientModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import {
  Users,
  Search,
  Plus,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  FolderGit2,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Client {
  id: string;
  leadId: string | null;
  name: string;
  mobile: string;
  email: string | null;
  company: string | null;
  city: string | null;
  status: string; // ACTIVE, COMPLETED, ON_HOLD, INACTIVE
  clientSince: string;
  createdAt: string;
  projects: {
    id: string;
    name: string;
    type: string | null;
    status: string;
  }[];
  activities: {
    createdAt: string;
    description: string;
  }[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectStatusFilter, setProjectStatusFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClientData, setDeleteClientData] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleDeleteConfirm = async () => {
    if (!deleteClientData) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deleteClientData.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteClientData(null);
        fetchClients();
      }
    } catch (err) {
      console.error('Failed to delete client:', err);
    } finally {
      setDeleting(false);
    }
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        projectStatus: projectStatusFilter,
        page: page.toString(),
        limit: '20',
      });
      const res = await fetch(`/api/clients?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, projectStatusFilter, page]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
            <PauseCircle className="w-3.5 h-3.5" /> On Hold
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full">
            <XCircle className="w-3.5 h-3.5" /> Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full">
            {status}
          </span>
        );
    }
  };

  const statusTabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'On Hold', value: 'ON_HOLD' },
    { label: 'Inactive', value: 'INACTIVE' },
  ];

  return (
    <AppLayout title="Clients Workspace">
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-indigo-600" />
              Client Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Workspace for confirmed clients, projects, requirements, documents, and communication history
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all hover:shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Project Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client name, mobile, email, or company..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={projectStatusFilter}
                onChange={(e) => {
                  setProjectStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Project Statuses</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PLANNED">Planned</option>
                <option value="ON_HOLD">Project On Hold</option>
                <option value="COMPLETED">Completed Projects</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button
                onClick={fetchClients}
                title="Refresh clients"
                className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Client List Content */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading client workspace...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Clients Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {search || statusFilter !== 'ALL'
                  ? 'No clients match your filter criteria.'
                  : 'No confirmed clients exist yet. Accept a quotation or add a manual client.'}
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Client
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Company</th>
                    <th className="py-3.5 px-4">Mobile</th>
                    <th className="py-3.5 px-4">Projects</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4">Last Activity</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {clients.map((client) => {
                    const latestProject = client.projects[0];
                    const lastActivity = client.activities[0];
                    return (
                      <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Client Name & Email */}
                        <td className="py-3.5 px-4">
                          <Link href={`/clients/${client.id}`} className="font-bold text-slate-900 hover:text-indigo-600 block">
                            {client.name}
                          </Link>
                          {client.email ? (
                            <span className="text-[11px] text-slate-400 block truncate">{client.email}</span>
                          ) : (
                            <span className="text-[11px] text-slate-300 block">No email</span>
                          )}
                        </td>

                        {/* Company */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {client.company || <span className="text-slate-300">--</span>}
                        </td>

                        {/* Mobile */}
                        <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                          {client.mobile}
                        </td>

                        {/* Project */}
                        <td className="py-3.5 px-4">
                          {latestProject ? (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                                {latestProject.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {client.projects.length} project{client.projects.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No projects yet</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">{getStatusBadge(client.status)}</td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-slate-500">
                          {format(new Date(client.clientSince || client.createdAt), 'dd MMM yyyy')}
                        </td>

                        {/* Last Activity */}
                        <td className="py-3.5 px-4 text-slate-500">
                          {lastActivity ? (
                            <span title={lastActivity.description}>
                              {format(new Date(lastActivity.createdAt), 'dd MMM yyyy')}
                            </span>
                          ) : (
                            format(new Date(client.createdAt), 'dd MMM yyyy')
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/clients/${client.id}`}
                              className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                              title="View Client Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => setEditClient(client)}
                              className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                              title="Edit Client Details"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteClientData(client)}
                              className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                              title="Delete Client"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {clients.map((client) => {
                const latestProject = client.projects[0];
                return (
                  <div key={client.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/clients/${client.id}`} className="font-bold text-slate-900 text-base hover:text-indigo-600">
                          {client.name}
                        </Link>
                        {client.company && (
                          <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {client.company}
                          </p>
                        )}
                      </div>
                      <div>{getStatusBadge(client.status)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{client.mobile}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{format(new Date(client.clientSince || client.createdAt), 'dd MMM yyyy')}</span>
                      </div>
                    </div>

                    {latestProject && (
                      <div className="p-2.5 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Project</span>
                          <span className="font-semibold text-slate-800">{latestProject.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded">
                          {latestProject.status}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-1.5 border-t border-slate-100">
                      <Link
                        href={`/clients/${client.id}`}
                        className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setEditClient(client)}
                        className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                        title="Edit Client"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteClientData(client)}
                        className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={fetchClients}
      />

      {/* Edit Client Modal */}
      {editClient && (
        <EditClientModal
          isOpen={!!editClient}
          client={editClient}
          onClose={() => setEditClient(null)}
          onClientUpdated={() => {
            setEditClient(null);
            fetchClients();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteClientData}
        onClose={() => setDeleteClientData(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client Record"
        description={`Are you sure you want to delete client "${deleteClientData?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </AppLayout>
  );
}
