'use client';

import React, { useState, useEffect } from 'react';
import { X, UploadCloud, File, AlertCircle, CheckCircle2, FileText, Upload } from 'lucide-react';

interface UploadFileModalProps {
  isOpen: boolean;
  clientId: string;
  projects?: { id: string; name: string }[];
  initialCategory?: string;
  initialMode?: 'file' | 'text';
  onClose: () => void;
  onFileUploaded: () => void;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  clientId,
  projects = [],
  initialCategory = 'Requirements',
  initialMode = 'file',
  onClose,
  onFileUploaded,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState(initialCategory);
  const [projectId, setProjectId] = useState('');
  
  // Text Input Mode states
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setCategory(initialCategory);
      setSelectedFile(null);
      setProjectId('');
      setTextTitle('');
      setTextContent('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialCategory, initialMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setError(null);

      // Auto set category recommendation based on extension
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext || '')) {
        if (f.name.toLowerCase().includes('logo')) {
          setCategory('Logo');
        } else {
          setCategory('Images');
        }
      } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext || '')) {
        if (f.name.toLowerCase().includes('requirement')) {
          setCategory('Requirements');
        } else {
          setCategory('Documents');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (activeTab === 'file' && !selectedFile) {
      setError('Please choose a file to upload.');
      return;
    }

    if (activeTab === 'text') {
      if (!textTitle.trim()) {
        setError('Please enter a title for the requirement document.');
        return;
      }
      if (!textContent.trim()) {
        setError('Please enter the requirement text content.');
        return;
      }
    }

    setLoading(true);

    try {
      if (activeTab === 'file') {
        const formData = new FormData();
        formData.append('file', selectedFile!);
        formData.append('category', category);
        if (projectId) formData.append('projectId', projectId);

        const res = await fetch(`/api/clients/${clientId}/files`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload file');
      } else {
        // Text Input mode
        const res = await fetch(`/api/clients/${clientId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: textTitle.trim(),
            textContent: textContent.trim(),
            category,
            projectId: projectId || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save text requirement');
      }

      setSuccess(true);
      setTimeout(() => {
        onFileUploaded();
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Unable to save requirement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Add Client Document / Requirements</h3>
            <p className="text-xs text-slate-500">Upload a file or type written text requirements directly</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Method Segmented Control */}
        <div className="p-3 bg-slate-100/60 border-b border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('file'); setError(null); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'file'
                ? 'bg-white text-indigo-600 shadow-2xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('text'); setError(null); }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'text'
                ? 'bg-white text-indigo-600 shadow-2xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-4 h-4" /> Text Input / Write Notes
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{activeTab === 'file' ? 'File uploaded successfully!' : 'Text requirement saved successfully!'}</span>
            </div>
          )}

          {/* MODE 1: FILE UPLOAD */}
          {activeTab === 'file' && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="client-file-input"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="client-file-input" className="cursor-pointer block space-y-2">
                <UploadCloud className="w-8 h-8 mx-auto text-indigo-500" />
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-indigo-600">Click to select file</span> or drag & drop
                </div>
                <p className="text-[10px] text-slate-400">
                  Supported: Images (JPG, PNG, WEBP), PDFs, Docs, Sheets, TXT, ZIP (Max 25MB)
                </p>
              </label>

              {selectedFile && (
                <div className="mt-4 p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs text-left">
                  <div className="flex items-center gap-2 truncate">
                    <File className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{selectedFile.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: TEXT INPUT */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requirement / Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Website Requirements Specification, Scope Document..."
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requirement Details / Text Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Type or paste requirement details, technical scope, user stories, or client specifications..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Category & Project Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Requirements">Requirements</option>
                <option value="Logo">Logo</option>
                <option value="Images">Images</option>
                <option value="Documents">Documents</option>
                <option value="References">References</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Project (Optional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">General Client File</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (activeTab === 'file' && !selectedFile)}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {loading
                ? 'Saving...'
                : activeTab === 'file'
                ? 'Upload File'
                : 'Save Text Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
