'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EditClientModal } from '@/components/clients/EditClientModal';
import { AddProjectModal } from '@/components/clients/AddProjectModal';
import { EditProjectModal } from '@/components/clients/EditProjectModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { UploadFileModal } from '@/components/clients/UploadFileModal';
import { ViewTextFileModal } from '@/components/clients/ViewTextFileModal';
import { AddNoteModal } from '@/components/clients/AddNoteModal';
import { EditRequirementsModal } from '@/components/clients/EditRequirementsModal';
import { ScheduleFollowUpModal } from '@/components/leads/ScheduleFollowUpModal';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { getClientWhatsAppLink } from '@/lib/whatsappUtils';
import {
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FolderGit2,
  FileText,
  Presentation,
  CalendarClock,
  MessageSquare,
  History,
  Plus,
  Edit,
  Pencil,
  Upload,
  ExternalLink,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  File,
  Image as ImageIcon,
  ChevronRight,
  ArrowUpRight,
  FileCode,
  Sparkles,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: overview, projects, requirements, files, quotations, demos, followups, notes, activity
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false);
  const [uploadModalMode, setUploadModalMode] = useState<'file' | 'text'>('file');
  const [uploadModalCategory, setUploadModalCategory] = useState<string>('Requirements');
  const [viewTextFile, setViewTextFile] = useState<any>(null);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isScheduleFollowUpOpen, setIsScheduleFollowUpOpen] = useState(false);
  const [editingRequirementsProject, setEditingRequirementsProject] = useState<any>(null);
  const [editProjectData, setEditProjectData] = useState<any>(null);
  const [deleteProjectData, setDeleteProjectData] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  const openUploadModal = (mode: 'file' | 'text' = 'file', category: string = 'Requirements') => {
    setUploadModalMode(mode);
    setUploadModalCategory(category);
    setIsUploadFileOpen(true);
  };

  const handleDeleteProjectConfirm = async () => {
    if (!deleteProjectData) return;
    setDeletingProject(true);
    try {
      const res = await fetch(`/api/clients/${id}/projects/${deleteProjectData.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteProjectData(null);
        fetchClientProfile();
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setDeletingProject(false);
    }
  };

  // Note Composer state inside Notes tab
  const [newNoteText, setNewNoteText] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Files Tab Category Filter
  const [fileCategoryFilter, setFileCategoryFilter] = useState('ALL');

  const fetchClientProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch client profile');
      setClient(data);
    } catch (err: any) {
      console.error('Error loading client profile:', err);
      setError(err.message || 'Client profile not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClientProfile();
  }, [fetchClientProfile]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchClientProfile();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleAddDirectNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setNoteSubmitting(true);
    try {
      const res = await fetch(`/api/clients/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNoteText.trim() }),
      });
      if (res.ok) {
        setNewNoteText('');
        fetchClientProfile();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch(`/api/clients/${id}/files?fileId=${fileId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchClientProfile();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/api/clients/${id}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchClientProfile();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    try {
      const res = await fetch(`/api/follow-ups/${followUpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      if (res.ok) fetchClientProfile();
    } catch (err) {
      console.error('Failed to complete follow-up:', err);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading Client...">
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Loading client workspace...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !client) {
    return (
      <AppLayout title="Client Not Found">
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-4 max-w-lg mx-auto my-8">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Client Not Found</h2>
          <p className="text-sm text-slate-500">{error || 'The requested client workspace does not exist.'}</p>
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
          >
            Return to Clients
          </Link>
        </div>
      </AppLayout>
    );
  }

  const projects = client.projects || [];
  const files = client.files || [];
  const notes = client.clientNotes || [];
  const quotations = client.quotations || [];
  const demos = client.demos || [];
  const followUps = client.followUps || [];
  const activities = client.activities || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active Client
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Projects Completed
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
            <PauseCircle className="w-3.5 h-3.5" /> On Hold
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-full">
            <XCircle className="w-3.5 h-3.5" /> Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-full">
            {status}
          </span>
        );
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users, count: null },
    { id: 'projects', label: 'Projects', icon: FolderGit2, count: projects.length },
    { id: 'requirements', label: 'Requirements', icon: FileCode, count: null },
    { id: 'files', label: 'Files & Documents', icon: FileText, count: files.length },
    { id: 'quotations', label: 'Quotations', icon: FileText, count: quotations.length },
    { id: 'demos', label: 'Demos', icon: Presentation, count: demos.length },
    { id: 'followups', label: 'Follow-ups', icon: CalendarClock, count: followUps.filter((f: any) => f.status === 'PENDING').length },
    { id: 'notes', label: 'Notes', icon: MessageSquare, count: notes.length },
    { id: 'activity', label: 'Activity Log', icon: History, count: activities.length },
  ];

  const filteredFiles = files.filter((f: any) => {
    if (fileCategoryFilter === 'ALL') return true;
    return f.category === fileCategoryFilter;
  });

  return (
    <AppLayout title={`${client.name} - Client Profile`}>
      <div className="space-y-6 pb-12">
        {/* Profile Header Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.name}</h1>
                {getStatusBadge(client.status)}
                {client.company && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    {client.company}
                  </span>
                )}
              </div>

              {/* Contact metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-mono font-medium">
                  <Phone className="w-3.5 h-3.5 text-indigo-600" />
                  {client.mobile}
                </span>

                {client.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    {client.email}
                  </span>
                )}

                {client.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    {client.city}
                  </span>
                )}

                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Client since {format(new Date(client.clientSince || client.createdAt), 'dd MMM yyyy')}
                </span>

                {client.leadId && (
                  <Link
                    href={`/leads/${client.leadId}`}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                  >
                    Original Lead <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <WhatsAppButton
                href={getClientWhatsAppLink({
                  name: client.name,
                  mobile: client.mobile,
                  company: client.company,
                })}
                title="Send WhatsApp Message"
              />

              <button
                onClick={() => setIsAddProjectOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>

              <button
                onClick={() => setIsUploadFileOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" /> Upload File
              </button>

              <button
                onClick={() => setIsAddNoteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-slate-500" /> Add Note
              </button>

              <button
                onClick={() => setIsScheduleFollowUpOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200/80 rounded-lg transition-colors"
              >
                <CalendarClock className="w-4 h-4 text-amber-600" /> Schedule Follow-up
              </button>

              <button
                onClick={() => setIsEditClientOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Edit Client Information"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white rounded-xl shadow-sm px-3 overflow-x-auto">
          <nav className="flex space-x-1 min-w-max">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-3 border-b-2 font-semibold text-xs transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                  {t.count !== null && t.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 columns: Information & Active Projects */}
            <div className="lg:col-span-2 space-y-6">
              {/* Information Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" /> Client Details
                  </h3>
                  <button
                    onClick={() => setIsEditClientOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Edit Info
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Full Name</span>
                    <span className="font-bold text-slate-800 text-sm">{client.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Company / Business</span>
                    <span className="font-bold text-slate-800">{client.company || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Mobile Number</span>
                    <span className="font-bold font-mono text-slate-800">{client.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Email Address</span>
                    <span className="font-bold text-slate-800">{client.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">City</span>
                    <span className="font-bold text-slate-800">{client.city || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Address</span>
                    <span className="font-bold text-slate-800">{client.address || 'N/A'}</span>
                  </div>
                </div>

                {client.notes && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">General Notes</span>
                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {client.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Active Projects List */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-indigo-600" /> Projects ({projects.length})
                  </h3>
                  <button
                    onClick={() => setIsAddProjectOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl space-y-2">
                    <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">No projects yet</p>
                    <button
                      onClick={() => setIsAddProjectOpen(true)}
                      className="px-3 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg"
                    >
                      + Add Project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {projects.map((proj: any) => (
                      <div
                        key={proj.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{proj.name}</span>
                            <span className="text-[10px] px-2 py-0.5 font-bold rounded bg-indigo-100 text-indigo-700">
                              {proj.type || 'Website'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 font-bold rounded bg-slate-200 text-slate-700">
                              {proj.status}
                            </span>
                          </div>
                          {proj.description && (
                            <p className="text-xs text-slate-600 line-clamp-1">{proj.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            {proj.startDate && <span>Started: {proj.startDate}</span>}
                            {proj.expectedCompletionDate && (
                              <span>Completion: {proj.expectedCompletionDate}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditProjectData(proj)}
                            className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                            title="Edit Project"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteProjectData(proj)}
                            className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/clients/${id}/projects/${proj.id}`}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-100 transition-colors shrink-0 text-center"
                          >
                            View Project
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 column: Follow-ups & Activity overview */}
            <div className="space-y-6">
              {/* Upcoming Follow-ups */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-amber-600" /> Upcoming Follow-ups
                  </h3>
                  <button
                    onClick={() => setIsScheduleFollowUpOpen(true)}
                    className="text-xs font-semibold text-amber-700 hover:underline"
                  >
                    + Schedule
                  </button>
                </div>

                {followUps.filter((f: any) => f.status === 'PENDING').length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">No upcoming follow-ups scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {followUps
                      .filter((f: any) => f.status === 'PENDING')
                      .slice(0, 3)
                      .map((f: any) => (
                        <div key={f.id} className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-lg space-y-2 text-xs">
                          <div className="flex items-center justify-between font-bold text-amber-900">
                            <span>{f.followUpDate} at {f.followUpTime}</span>
                            <button
                              onClick={() => handleCompleteFollowUp(f.id)}
                              className="text-[10px] px-2 py-0.5 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700"
                            >
                              Mark Complete
                            </button>
                          </div>
                          <p className="text-amber-800 font-medium">{f.note}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Latest Quotation & Demo */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="w-4 h-4 text-indigo-600" /> Latest Commercial Snapshots
                </h3>

                {quotations.length > 0 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-indigo-600">{quotations[0].quotationNumber}</span>
                      <span className="text-slate-900">₹{quotations[0].grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] truncate">{quotations[0].projectTitle}</p>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded inline-block">
                      {quotations[0].status}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No quotations linked.</p>
                )}

                {demos.length > 0 && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-800">Demo on {demos[0].demoDate}</span>
                      <span className="text-[10px] font-semibold text-indigo-600">{demos[0].status}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Result: {demos[0].demoResult || 'N/A'}</p>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                  <History className="w-4 h-4 text-slate-600" /> Recent Activity
                </h3>

                {activities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No activity logs recorded.</p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activities.slice(0, 5).map((act: any) => (
                      <div key={act.id} className="pl-6 relative text-xs space-y-0.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 absolute left-1 top-1.5 -translate-x-1/2" />
                        <p className="font-semibold text-slate-800">{act.description}</p>
                        <span className="text-[10px] text-slate-400 block">
                          {format(new Date(act.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Client Projects ({projects.length})</h2>
              <button
                onClick={() => setIsAddProjectOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
                <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Projects Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create dedicated projects to manage website development, mobile apps, SEO, or software modules.
                </p>
                <button
                  onClick={() => setIsAddProjectOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj: any) => (
                  <div key={proj.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{proj.name}</h3>
                        <span className="text-xs font-semibold text-indigo-600 block mt-0.5">
                          {proj.type || 'Website'}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                        {proj.status}
                      </span>
                    </div>

                    {proj.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {proj.description}
                      </p>
                    )}

                    {proj.requirements && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Requirements Preview</span>
                        <p className="text-xs text-slate-700 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {proj.requirements}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] block font-semibold text-slate-400">Start Date</span>
                        <span>{proj.startDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] block font-semibold text-slate-400">Expected Completion</span>
                        <span>{proj.expectedCompletionDate || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">
                        {proj.files?.length || 0} file{proj.files?.length !== 1 ? 's' : ''} attached
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditProjectData(proj)}
                          className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                          title="Edit Project"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteProjectData(proj)}
                          className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/clients/${id}/projects/${proj.id}`}
                          className="px-3.5 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
                        >
                          View Project Details <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REQUIREMENTS */}
        {activeTab === 'requirements' && (
          <div className="space-y-6">
            {/* Header Action Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-600" /> Requirements Workspace
                </h3>
                <p className="text-xs text-slate-500">Manage lead specifications, project requirements, and written notes</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openUploadModal('text', 'Requirements')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-4 h-4" /> + Write Text Requirement
                </button>
                <button
                  onClick={() => openUploadModal('file', 'Requirements')}
                  className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4 text-indigo-600" /> Upload File
                </button>
              </div>
            </div>

            {/* Original Lead Requirements */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600" /> Original Lead Requirements
                </h3>
                <span className="text-xs font-semibold text-slate-400">Historical Snapshot</span>
              </div>
              <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                {client.lead?.initialRequirements || 'No initial requirements were recorded on the original Lead.'}
              </p>
            </div>

            {/* Uploaded & Written Requirement Documents */}
            {files.filter((f: any) => f.category === 'Requirements').length > 0 && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" /> Attached Requirement Files & Text Notes ({files.filter((f: any) => f.category === 'Requirements').length})
                  </h3>
                  <button
                    onClick={() => openUploadModal('text', 'Requirements')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    + Add More
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {files.filter((f: any) => f.category === 'Requirements').map((file: any) => {
                    const isText = file.fileType === 'text/plain' || file.fileName?.endsWith('.txt');
                    return (
                      <div key={file.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                              {isText ? 'Text Requirement' : 'File'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {(file.fileSize / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs truncate" title={file.fileName}>
                            {file.fileName}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            Added: {format(new Date(file.createdAt), 'dd MMM yyyy')}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1 text-xs">
                          {isText ? (
                            <button
                              onClick={() => setViewTextFile(file)}
                              className="px-2.5 py-1 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5" /> Read Text
                            </button>
                          ) : (
                            <a
                              href={file.fileReference}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 text-[11px]"
                            >
                              <Download className="w-3 h-3" /> Download
                            </a>
                          )}

                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Final Project Requirements & Requirement History */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Final Project Requirements</h3>
              {projects.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No projects created yet. Add a project to define requirements.</p>
              ) : (
                projects.map((proj: any) => (
                  <div key={proj.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{proj.name}</h4>
                        <span className="text-[11px] text-slate-400">Current Final Requirements</span>
                      </div>
                      <button
                        onClick={() => setEditingRequirementsProject(proj)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit / Update Requirements
                      </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-800 whitespace-pre-wrap">
                      {proj.requirements || 'No requirements specified yet.'}
                    </div>

                    {/* Requirement History Log */}
                    {proj.requirementHistories && proj.requirementHistories.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Requirement History Log ({proj.requirementHistories.length})
                        </span>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {proj.requirementHistories.map((hist: any) => (
                            <div key={hist.id} className="p-3 bg-slate-100/70 rounded-lg text-xs space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                                <span>{hist.changeDescription || 'Requirements Updated'}</span>
                                <span>{format(new Date(hist.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                              </div>
                              <p className="text-slate-700 text-[11px] italic line-clamp-2">{hist.requirements}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FILES & DOCUMENTS */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['ALL', 'Logo', 'Images', 'Documents', 'Requirements', 'References', 'Other'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFileCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      fileCategoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openUploadModal('file', fileCategoryFilter === 'ALL' ? 'Requirements' : fileCategoryFilter)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  <Upload className="w-4 h-4" /> Upload File
                </button>
                <button
                  onClick={() => openUploadModal('text', fileCategoryFilter === 'ALL' ? 'Requirements' : fileCategoryFilter)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-xl transition-colors"
                >
                  <FileText className="w-4 h-4 text-indigo-600" /> + Add Text Requirement / Note
                </button>
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Files Uploaded</h3>
                <p className="text-xs text-slate-500">
                  Upload logos, images, PDF requirements, design assets, or write text requirements for this client.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => openUploadModal('file', fileCategoryFilter === 'ALL' ? 'Requirements' : fileCategoryFilter)}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> Upload File
                  </button>
                  <button
                    onClick={() => openUploadModal('text', fileCategoryFilter === 'ALL' ? 'Requirements' : fileCategoryFilter)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" /> + Write Text Requirement
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFiles.map((file: any) => {
                  const isImage = file.fileType?.includes('image') || ['.png', '.jpg', '.jpeg', '.webp'].some((ext) => file.fileReference?.endsWith(ext));
                  const isText = file.fileType === 'text/plain' || file.fileName?.endsWith('.txt');
                  return (
                    <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between group">
                      <div className="space-y-2">
                        {/* Image Thumbnail or File Icon */}
                        <div className="h-32 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex items-center justify-center relative">
                          {isImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={file.fileReference}
                              alt={file.fileName}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <FileText className="w-12 h-12 text-indigo-400" />
                          )}
                          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 bg-slate-900/80 text-white rounded backdrop-blur-xs">
                            {file.category}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-xs truncate" title={file.fileName}>
                            {file.fileName}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {(file.fileSize / 1024).toFixed(1)} KB • {format(new Date(file.createdAt), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          {isText && (
                            <button
                              onClick={() => setViewTextFile(file)}
                              className="px-2.5 py-1 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition-colors inline-flex items-center gap-1 text-[11px]"
                            >
                              <Eye className="w-3 h-3" /> Read Text
                            </button>
                          )}
                          <a
                            href={file.fileReference}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 text-[11px]"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>

                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: QUOTATIONS */}
        {activeTab === 'quotations' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Linked Quotations ({quotations.length})</h2>

            {quotations.length === 0 ? (
              <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No quotations linked to this client yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Quotation #</th>
                      <th className="py-3 px-4">Project Title</th>
                      <th className="py-3 px-4">Grand Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {quotations.map((q: any) => (
                      <tr key={q.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-indigo-600">{q.quotationNumber}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{q.projectTitle}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">₹{q.grandTotal.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{q.quotationDate}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/quotations/${q.id}`}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                          >
                            View PDF <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: DEMOS */}
        {activeTab === 'demos' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Demo History ({demos.length})</h2>

            {demos.length === 0 ? (
              <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                <Presentation className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No demos scheduled or completed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demos.map((d: any) => (
                  <div key={d.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-900 text-sm">Demo on {d.demoDate} at {d.demoTime}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                        {d.status}
                      </span>
                    </div>

                    {d.demoResult && (
                      <p className="text-xs text-slate-700">
                        <strong className="text-slate-900">Result:</strong> {d.demoResult}
                      </p>
                    )}

                    {d.requirements && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {d.requirements}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: FOLLOW-UPS */}
        {activeTab === 'followups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Client Follow-ups ({followUps.length})</h2>
              <button
                onClick={() => setIsScheduleFollowUpOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-amber-700 transition-colors"
              >
                <CalendarClock className="w-4 h-4" /> Schedule Follow-up
              </button>
            </div>

            {followUps.length === 0 ? (
              <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                <CalendarClock className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No follow-ups recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {followUps.map((f: any) => (
                  <div
                    key={f.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {f.followUpDate} at {f.followUpTime}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            f.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {f.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">{f.note}</p>
                    </div>

                    {f.status === 'PENDING' && (
                      <button
                        onClick={() => handleCompleteFollowUp(f.id)}
                        className="px-3 py-1.5 bg-amber-600 text-white font-semibold text-xs rounded-lg hover:bg-amber-700 transition-colors shrink-0"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Note Composer Box */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" /> Write a Note
              </h3>
              <form onSubmit={handleAddDirectNote} className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Type important information, client preferences, or meeting updates..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={noteSubmitting || !newNoteText.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {noteSubmitting ? 'Posting...' : 'Add Note'}
                  </button>
                </div>
              </form>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-base">Client Notes ({notes.length})</h3>
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No notes created yet.</p>
              ) : (
                notes.map((n: any) => (
                  <div key={n.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                      <span className="font-bold text-slate-800">{n.createdBy || 'Sales Representative'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(n.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </span>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 9: ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Complete Activity History ({activities.length})</h2>

            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No activities recorded yet.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activities.map((act: any) => (
                  <div key={act.id} className="pl-8 relative text-xs space-y-1">
                    <div className="w-3 h-3 rounded-full bg-indigo-600 border-2 border-white absolute left-1.5 top-1 -translate-x-1/2 shadow-sm" />
                    <p className="font-bold text-slate-900">{act.description}</p>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {format(new Date(act.createdAt), 'dd MMMM yyyy, hh:mm:ss a')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditClientModal
        isOpen={isEditClientOpen}
        client={client}
        onClose={() => setIsEditClientOpen(false)}
        onClientUpdated={fetchClientProfile}
      />

      <AddProjectModal
        isOpen={isAddProjectOpen}
        clientId={id}
        onClose={() => setIsAddProjectOpen(false)}
        onProjectAdded={fetchClientProfile}
      />

      <UploadFileModal
        isOpen={isUploadFileOpen}
        clientId={id}
        projects={projects}
        initialMode={uploadModalMode}
        initialCategory={uploadModalCategory}
        onClose={() => setIsUploadFileOpen(false)}
        onFileUploaded={fetchClientProfile}
      />

      <ViewTextFileModal
        isOpen={!!viewTextFile}
        file={viewTextFile}
        onClose={() => setViewTextFile(null)}
      />

      <AddNoteModal
        isOpen={isAddNoteOpen}
        clientId={id}
        projects={projects}
        onClose={() => setIsAddNoteOpen(false)}
        onNoteAdded={fetchClientProfile}
      />

      <EditRequirementsModal
        isOpen={!!editingRequirementsProject}
        clientId={id}
        project={editingRequirementsProject}
        onClose={() => setEditingRequirementsProject(null)}
        onRequirementsSaved={fetchClientProfile}
      />

      {client.leadId && (
        <ScheduleFollowUpModal
          isOpen={isScheduleFollowUpOpen}
          onClose={() => setIsScheduleFollowUpOpen(false)}
          leadId={client.leadId}
          leadName={client.name}
          onFollowUpScheduled={fetchClientProfile}
        />
      )}

      {/* Edit Project Modal */}
      {editProjectData && (
        <EditProjectModal
          isOpen={!!editProjectData}
          clientId={id}
          project={editProjectData}
          onClose={() => setEditProjectData(null)}
          onProjectUpdated={() => {
            setEditProjectData(null);
            fetchClientProfile();
          }}
        />
      )}

      {/* Delete Project Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteProjectData}
        onClose={() => setDeleteProjectData(null)}
        onConfirm={handleDeleteProjectConfirm}
        title="Delete Project Record"
        description={`Are you sure you want to delete project "${deleteProjectData?.name}"? This action cannot be undone.`}
        loading={deletingProject}
      />
    </AppLayout>
  );
}
