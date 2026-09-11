'use client';

import React, { useState, useEffect } from 'react';
import { X, FileCode, AlertCircle, History } from 'lucide-react';

interface EditRequirementsModalProps {
  isOpen: boolean;
  clientId: string;
  project: {
    id: string;
    name: string;
    requirements: string | null;
  } | null;
  onClose: () => void;
  onRequirementsSaved: () => void;
}

export const EditRequirementsModal: React.FC<EditRequirementsModalProps> = ({
  isOpen,
  clientId,
  project,
  onClose,
  onRequirementsSaved,
}) => {
  const [requirements, setRequirements] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setRequirements(project.requirements || '');
      setChangeDescription('');
      setError(null);
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements,
          changeDescription: changeDescription.trim() || 'Requirements updated',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update requirements');

      onRequirementsSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Update Requirements</h3>
            <p className="text-xs text-slate-500">Project: {project.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Updated Final Requirements</label>
            <textarea
              rows={6}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="e.g. Added online room booking module, WhatsApp integration..."
              className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-600" />
              Reason / Summary of Change (For History Log)
            </label>
            <input
              type="text"
              placeholder="e.g. Added online booking feature per client request"
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {loading ? 'Saving History...' : 'Save Requirements'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
