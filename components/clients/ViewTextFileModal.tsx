'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Copy, Check, Download, AlertCircle } from 'lucide-react';

interface ViewTextFileModalProps {
  isOpen: boolean;
  file: {
    id: string;
    fileName: string;
    fileReference: string;
    category: string;
    createdAt: string;
  } | null;
  onClose: () => void;
}

export const ViewTextFileModal: React.FC<ViewTextFileModalProps> = ({
  isOpen,
  file,
  onClose,
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setError(null);
      setContent('');

      fetch(file.fileReference)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load text content');
          return res.text();
        })
        .then((txt) => {
          setContent(txt);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching text file:', err);
          setError('Could not preview text file content.');
          setLoading(false);
        });
    }
  }, [isOpen, file]);

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{file.fileName}</h3>
              <span className="text-xs text-slate-400">Category: {file.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading && (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading text content...</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text">
              {content || 'No content found in file.'}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleCopy}
            disabled={!content}
            className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Text'}
          </button>

          <div className="flex items-center gap-2">
            <a
              href={file.fileReference}
              download={file.fileName}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download File
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
