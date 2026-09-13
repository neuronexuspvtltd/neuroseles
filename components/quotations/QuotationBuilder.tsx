'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  CheckCircle2,
  Building2,
  User,
  Calendar,
  FileText,
  DollarSign,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { calculateQuotationTotals, QuotationItemCalculationInput } from '@/lib/quotationCalculations';
import { QuotationDocument } from './QuotationDocument';
import { formatPhoneNumber } from '@/lib/phoneUtils';

interface QuotationBuilderProps {
  initialLeadId?: string;
  existingQuotation?: any;
  isEditMode?: boolean;
}

export const QuotationBuilder: React.FC<QuotationBuilderProps> = ({
  initialLeadId,
  existingQuotation,
  isEditMode = false,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadIdQuery = initialLeadId || searchParams?.get('leadId') || '';

  // Leads list for dropdown
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  // Selected Lead
  const [selectedLeadId, setSelectedLeadId] = useState(leadIdQuery);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Company Settings
  const [companySettings, setCompanySettings] = useState<any>(null);

  // Form Fields
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [currency, setCurrency] = useState('INR');

  // Items List
  const [items, setItems] = useState<QuotationItemCalculationInput[]>([
    {
      name: 'Website Design & Development',
      description: 'Responsive modern website with required pages and enquiry form.',
      quantity: 1,
      unitPrice: 20000,
      discountType: 'FIXED',
      discountValue: 0,
      taxRate: 18,
    },
  ]);

  // Overall Discount
  const [overallDiscountType, setOverallDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(0);

  // Payment Terms, Terms & Conditions, Notes
  const [paymentTerms, setPaymentTerms] = useState('50% Advance Payment, 50% upon final project completion.');
  const [terms, setTerms] = useState<string[]>([
    '50% advance payment is required before project commencement.',
    'Remaining balance is due upon final project delivery/completion.',
    'Quotation validity is 15 days from the date of issue.',
    'Additional feature requests outside agreed scope will be billed separately.',
  ]);

  const [notes, setNotes] = useState('Thank you for considering our services. We look forward to working with you.');

  // Modals & Submission State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Leads List & Company Settings
  useEffect(() => {
    async function initData() {
      setLoadingLeads(true);
      try {
        const [leadsRes, settingsRes] = await Promise.all([
          fetch('/api/leads?sort=newest'),
          fetch('/api/settings/company'),
        ]);

        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setLeads(leadsData.leads || []);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setCompanySettings(settingsData);
          if (!isEditMode && settingsData.defaultPaymentTerms) {
            setPaymentTerms(settingsData.defaultPaymentTerms);
          }
          if (!isEditMode && settingsData.defaultTerms) {
            try {
              const parsed = typeof settingsData.defaultTerms === 'string' ? JSON.parse(settingsData.defaultTerms) : settingsData.defaultTerms;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setTerms(parsed);
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Failed to initialize builder data', err);
      } finally {
        setLoadingLeads(false);
      }
    }
    initData();
  }, [isEditMode]);

  // Load existing quotation data if editing
  useEffect(() => {
    if (existingQuotation) {
      setSelectedLeadId(existingQuotation.leadId);
      setSelectedLead(existingQuotation.lead);
      setProjectTitle(existingQuotation.projectTitle || '');
      setProjectDescription(existingQuotation.projectDescription || '');
      setQuotationDate(existingQuotation.quotationDate || '');
      setValidUntil(existingQuotation.validUntil || '');
      setCurrency(existingQuotation.currency || 'INR');
      setOverallDiscountType((existingQuotation.overallDiscountType as any) || 'FIXED');
      setOverallDiscountValue(existingQuotation.overallDiscountValue || 0);
      setPaymentTerms(existingQuotation.paymentTerms || '');
      setNotes(existingQuotation.notes || '');

      if (existingQuotation.items && existingQuotation.items.length > 0) {
        setItems(
          existingQuotation.items.map((it: any) => ({
            id: it.id,
            name: it.name,
            description: it.description || '',
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountType: it.discountType || 'FIXED',
            discountValue: it.discountValue || 0,
            taxRate: it.taxRate || 18,
          }))
        );
      }

      if (existingQuotation.termsSnapshot) {
        try {
          const parsed = typeof existingQuotation.termsSnapshot === 'string' ? JSON.parse(existingQuotation.termsSnapshot) : existingQuotation.termsSnapshot;
          if (Array.isArray(parsed)) setTerms(parsed);
        } catch (e) {}
      }
    }
  }, [existingQuotation]);

  // Sync selected lead details
  useEffect(() => {
    if (selectedLeadId && leads.length > 0) {
      const found = leads.find((l) => l.id === selectedLeadId);
      if (found) {
        setSelectedLead(found);
        if (!projectTitle && found.company) {
          setProjectTitle(`Quotation for ${found.company}`);
        }
      }
    }
  }, [selectedLeadId, leads, projectTitle]);

  // Live Summary Calculation
  const summary = useMemo(() => {
    return calculateQuotationTotals(items, overallDiscountType, overallDiscountValue);
  }, [items, overallDiscountType, overallDiscountValue]);

  // Add Item
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountType: 'FIXED',
        discountValue: 0,
        taxRate: companySettings?.defaultGstRate || 18,
      },
    ]);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setError('A quotation must have at least one item.');
      return;
    }
    setError(null);
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Item Field Change
  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Terms Management
  const handleAddTerm = () => {
    setTerms((prev) => [...prev, '']);
  };

  const handleTermChange = (index: number, val: string) => {
    setTerms((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleRemoveTerm = (index: number) => {
    setTerms((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit Handler
  const handleSave = async (targetStatus: 'DRAFT' | 'SENT') => {
    if (!selectedLeadId) {
      setError('Please select a Lead/Client first.');
      return;
    }
    if (!projectTitle.trim()) {
      setError('Please enter a Project Title.');
      return;
    }
    if (!quotationDate || !validUntil) {
      setError('Please select Quotation Date and Valid Until Date.');
      return;
    }

    const invalidItem = items.find((it) => !it.name.trim() || Number(it.quantity) <= 0 || Number(it.unitPrice) < 0);
    if (invalidItem) {
      setError('Every item must have a name, quantity > 0, and valid unit price.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        leadId: selectedLeadId,
        projectTitle: projectTitle.trim(),
        projectDescription: projectDescription.trim(),
        quotationDate,
        validUntil,
        currency,
        items,
        overallDiscountType,
        overallDiscountValue,
        paymentTerms,
        terms: terms.filter((t) => t.trim().length > 0),
        notes,
        status: targetStatus,
      };

      const url = isEditMode && existingQuotation ? `/api/quotations/${existingQuotation.id}` : '/api/quotations';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save quotation');
      }

      const savedData = await res.json();
      const qId = savedData.id || existingQuotation?.id;
      router.push(`/quotations/${qId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save quotation');
    } finally {
      setSubmitting(false);
    }
  };

  // Construct draft object for live preview
  const livePreviewQuotation = useMemo(() => {
    return {
      quotationNumber: existingQuotation?.quotationNumber || 'QT-DRAFT',
      quotationDate,
      validUntil,
      projectTitle: projectTitle || 'Project Quotation',
      projectDescription,
      currency,
      subtotal: summary.subtotal,
      itemDiscountTotal: summary.itemDiscountTotal,
      overallDiscountType,
      overallDiscountValue,
      overallDiscountAmount: summary.overallDiscountAmount,
      taxTotal: summary.taxTotal,
      grandTotal: summary.grandTotal,
      amountInWords: summary.amountInWords,
      paymentTerms,
      notes,
      lead: selectedLead || { name: 'Client Name', mobile: '+91 98765 43210' },
      items: summary.items,
      termsSnapshot: JSON.stringify(terms.filter((t) => t.trim().length > 0)),
      companySnapshot: companySettings
        ? JSON.stringify(companySettings)
        : null,
    };
  }, [
    existingQuotation,
    quotationDate,
    validUntil,
    projectTitle,
    projectDescription,
    currency,
    summary,
    overallDiscountType,
    overallDiscountValue,
    paymentTerms,
    notes,
    selectedLead,
    terms,
    companySettings,
  ]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {isEditMode ? `Edit Quotation ${existingQuotation?.quotationNumber}` : 'Create New Quotation'}
          </h1>
          <p className="text-xs text-slate-500">Build a professional proposal for your lead</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('SENT')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Mark Sent</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Form & Sticky Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Lead Select, Project Details, Items, Terms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              1. Customer / Lead Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Lead / Client *</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  disabled={loadingLeads || isEditMode}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Existing Lead --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.company ? `(${l.company})` : ''} - [{l.status}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedLead && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-indigo-900">{selectedLead.name}</div>
                  <div className="text-slate-600 font-mono">{formatPhoneNumber(selectedLead.mobile)}</div>
                  {selectedLead.company && <div className="text-slate-600">Company: {selectedLead.company}</div>}
                  {selectedLead.email && <div className="text-slate-600">Email: {selectedLead.email}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Project & Quotation Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              2. Quotation Details & Validity
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Development for ABC Hotel"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of the scope of work or project..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quotation Date *</label>
                  <input
                    type="date"
                    required
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid Until Date *</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Quotation Items & Services */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                3. Services / Items List
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Items Table Form */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3 relative text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-700">
                    <span>Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Service / Item Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Website Design & Development"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Includes responsive mobile design"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Unit Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Discount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.discountValue || 0}
                        onChange={(e) => handleItemChange(idx, 'discountValue', Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">GST Rate (%)</label>
                      <select
                        value={item.taxRate || 18}
                        onChange={(e) => handleItemChange(idx, 'taxRate', Number(e.target.value))}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                      >
                        <option value={0}>0% (Exempt)</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18% (Standard)</option>
                        <option value={28}>28%</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Overall Discount & Terms */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              4. Overall Discount & Payment Terms
            </h2>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Overall Discount Type</label>
                  <select
                    value={overallDiscountType}
                    onChange={(e) => setOverallDiscountType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  >
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Overall Discount Value</label>
                  <input
                    type="number"
                    min="0"
                    value={overallDiscountValue}
                    onChange={(e) => setOverallDiscountValue(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Milestones / Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 50% Advance, 50% on Delivery"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Terms & Conditions List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Terms & Conditions</label>
                  <button
                    type="button"
                    onClick={handleAddTerm}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    + Add Condition
                  </button>
                </div>

                {terms.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-xs">{idx + 1}.</span>
                    <input
                      type="text"
                      value={t}
                      onChange={(e) => handleTermChange(idx, e.target.value)}
                      className="flex-1 p-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quotation Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional closing message or notes..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Sticky Financial Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4 lg:sticky lg:top-24">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Financial Summary</span>
              <span className="text-xs font-mono text-indigo-600 font-bold">{currency}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">₹{summary.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {summary.itemDiscountTotal > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Item Discounts:</span>
                  <span className="font-mono">-₹{summary.itemDiscountTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              {summary.overallDiscountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Overall Discount:</span>
                  <span className="font-mono">-₹{summary.overallDiscountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>GST Total:</span>
                <span className="font-mono font-semibold">₹{summary.taxTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">Grand Total:</span>
                <span className="font-mono font-extrabold text-xl text-indigo-700">
                  ₹{summary.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Amount in Words:
                </span>
                <span className="text-xs font-bold text-indigo-900 italic mt-0.5 block">
                  {summary.amountInWords}
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handleSave('SENT')}
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Mark Sent</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave('DRAFT')}
                disabled={submitting}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Document Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900">Quotation Preview</h3>
                <p className="text-xs text-slate-500">Document layout representation</p>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QuotationDocument quotation={livePreviewQuotation} />
          </div>
        </div>
      )}
    </div>
  );
};
