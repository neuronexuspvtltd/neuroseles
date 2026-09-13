'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EditRequirementsModal } from '@/components/clients/EditRequirementsModal';
import { EditProjectModal } from '@/components/clients/EditProjectModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { UploadFileModal } from '@/components/clients/UploadFileModal';
import { ViewTextFileModal } from '@/components/clients/ViewTextFileModal';
import { AddNoteModal } from '@/components/clients/AddNoteModal';
import {
  FolderGit2,
  Calendar,
  FileCode,
  FileText,
  MessageSquare,
  History,
  Upload,
  Plus,
  ArrowLeft,
  ChevronRight,
  Download,
  Trash2,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Edit,
  Pencil,
  Building,
  User,
  Phone,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id: clientId, projectId } = use(params);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditReqOpen, setIsEditReqOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false);
  const [uploadModalMode, setUploadModalMode] = useState<'file' | 'text'>('file');
  const [uploadModalCategory, setUploadModalCategory] = useState<string>('Requirements');
  const [viewTextFile, setViewTextFile] = useState<any>(null);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

  const openUploadModal = (mode: 'file' | 'text' = 'file', category: string = 'Requirements') => {
    setUploadModalMode(mode);
    setUploadModalCategory(category);
    setIsUploadFileOpen(true);
  };

  const handleDeleteProject = async () => {
    setDeletingProject(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        window.location.href = `/clients/${clientId}`;
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setDeletingProject(false);
    }
  };

  const fetchProjectDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/projects/${projectId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Project not found');
      setProject(data);
    } catch (err: any) {
      console.error('Error loading project detail:', err);
      setError(err.message || 'Project detail not found');
    } finally {
      setLoading(false);
    }
  }, [clientId, projectId]);

  useEffect(() => {
    fetchProjectDetail();
  }, [fetchProjectDetail]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchProjectDetail();
    } catch (err) {
      console.error('Failed to change project status:', err);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading Project...">
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Loading project details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout title="Project Not Found">
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-4 max-w-lg mx-auto my-8">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
          <p className="text-sm text-slate-500">{error || 'The requested project does not exist.'}</p>
          <Link
            href={`/clients/${clientId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
          >
            Back to Client Workspace
          </Link>
        </div>
      </AppLayout>
    );
  }

  const files = project.files || [];
  const notes = project.projectNotes || [];
  const historyLogs = project.requirementHistories || [];
  const activities = project.activities || [];

  return (
    <AppLayout title={`${project.name} - Project Details`}>
      <div className="space-y-6 pb-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/clients" className="hover:text-indigo-600">Clients</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href={`/clients/${clientId}`} className="hover:text-indigo-600">{project.client?.name}</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-slate-900">{project.name}</span>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
                <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700">
                  {project.type || 'Website'}
                </span>
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PLANNED">Planned</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Client: <strong className="text-slate-800">{project.client?.name}</strong> ({project.client?.company || 'Direct Client'})
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsEditProjectOpen(true)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Pencil className="w-4 h-4" /> Edit Project
              </button>

              <button
                onClick={() => setIsEditReqOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Edit className="w-4 h-4" /> Edit Specs
              </button>
              <button
                onClick={() => setIsUploadFileOpen(true)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4 text-slate-500" /> Attach File
              </button>
              <button
                onClick={() => setIsAddNoteOpen(true)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4 text-slate-500" /> Add Note
              </button>

              <button
                onClick={() => setIsDeleteProjectOpen(true)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Project
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-100">
            <div>
              <span className="text-slate-400 block font-medium">Start Date</span>
              <span className="font-bold text-slate-800">{project.startDate || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Expected Completion</span>
              <span className="font-bold text-slate-800">{project.expectedCompletionDate || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Files Attached</span>
              <span className="font-bold text-slate-800">{files.length}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Notes</span>
              <span className="font-bold text-slate-800">{notes.length}</span>
            </div>
          </div>
        </div>

        {/* Requirements & Description Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {project.description && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">Project Overview</h3>
                <p className="text-xs text-slate-700">{project.description}</p>
              </div>
            )}

            {/* Current Final Requirements */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600" /> Project Requirements
                </h3>
                <button
                  onClick={() => setIsEditReqOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Edit / Append
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-800 whitespace-pre-wrap">
                {project.requirements || 'No specific requirements logged for this project.'}
              </div>
            </div>

            {/* Requirement History Log */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                <History className="w-4 h-4 text-slate-600" /> Requirement History Log ({historyLogs.length})
              </h3>

              {historyLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No requirement edits logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((hist: any) => (
                    <div key={hist.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{hist.changeDescription || 'Updated Requirements'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {format(new Date(hist.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] whitespace-pre-wrap">{hist.requirements}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Files & Activity */}
          <div className="space-y-6">
            {/* Project Files */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Project Files & Requirements ({files.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openUploadModal('text', 'Requirements')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    + Write Text
                  </button>
                  <span className="text-slate-300 text-xs">|</span>
                  <button
                    onClick={() => openUploadModal('file', 'Requirements')}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    + Upload
                  </button>
                </div>
              </div>

              {files.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No files or text requirements attached to this project.</p>
              ) : (
                <div className="space-y-2">
                  {files.map((file: any) => {
                    const isText = file.fileType === 'text/plain' || file.fileName?.endsWith('.txt');
                    return (
                      <div key={file.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]" title={file.fileName}>
                          {file.fileName}
                        </span>
                        <div className="flex items-center gap-2">
                          {isText ? (
                            <button
                              onClick={() => setViewTextFile(file)}
                              className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                            >
                              <Eye className="w-3 h-3" /> Read
                            </button>
                          ) : (
                            <a
                              href={file.fileReference}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                            >
                              <Download className="w-3 h-3" /> Get
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Project Notes */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" /> Project Notes ({notes.length})
                </h3>
                <button
                  onClick={() => setIsAddNoteOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  + Note
                </button>
              </div>

              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No project notes added.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((n: any) => (
                    <div key={n.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {format(new Date(n.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap">{n.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditRequirementsModal
        isOpen={isEditReqOpen}
        clientId={clientId}
        project={project}
        onClose={() => setIsEditReqOpen(false)}
        onRequirementsSaved={fetchProjectDetail}
      />

      <UploadFileModal
        isOpen={isUploadFileOpen}
        clientId={clientId}
        projects={[{ id: project.id, name: project.name }]}
        initialMode={uploadModalMode}
        initialCategory={uploadModalCategory}
        onClose={() => setIsUploadFileOpen(false)}
        onFileUploaded={fetchProjectDetail}
      />

      <ViewTextFileModal
        isOpen={!!viewTextFile}
        file={viewTextFile}
        onClose={() => setViewTextFile(null)}
      />

      <AddNoteModal
        isOpen={isAddNoteOpen}
        clientId={clientId}
        projects={[{ id: project.id, name: project.name }]}
        onClose={() => setIsAddNoteOpen(false)}
        onNoteAdded={fetchProjectDetail}
      />

      <EditProjectModal
        isOpen={isEditProjectOpen}
        clientId={clientId}
        project={project}
        onClose={() => setIsEditProjectOpen(false)}
        onProjectUpdated={fetchProjectDetail}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        description={`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`}
        loading={deletingProject}
      />
    </AppLayout>
  );
}
