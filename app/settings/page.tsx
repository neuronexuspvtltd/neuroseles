'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Building2, Save, CheckCircle2, AlertCircle, Image as ImageIcon, CreditCard, User, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState('NEURONEXUS NEXT-GEN INTELLIGENCE');
  const [logo, setLogo] = useState('/logo.png');
  const [email, setEmail] = useState('contact@neuronexus.ai');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [website, setWebsite] = useState('https://neuronexus.ai');
  const [address, setAddress] = useState('123 Tech Park, Suite 400, Mumbai, India');
  const [gstNumber, setGstNumber] = useState('27AAAAA0000A1Z5');
  const [stateName, setStateName] = useState('Maharashtra (27)');

  // Bank Details state
  const [bankName, setBankName] = useState('HDFC BANK');
  const [accountNumber, setAccountNumber] = useState('50200012345678');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [branchName, setBranchName] = useState('Mumbai Branch');

  const [quotationPrefix, setQuotationPrefix] = useState('QT-');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [defaultGstRate, setDefaultGstRate] = useState(18);
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState('50% Advance Payment, 50% upon final project completion.');
  const [terms, setTerms] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }

        const res = await fetch('/api/settings/company');
        if (res.ok) {
          const data = await res.json();
          setCompanyName(data.companyName || 'NEURONEXUS NEXT-GEN INTELLIGENCE');
          setLogo(data.logo || '/logo.png');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setWebsite(data.website || '');
          setAddress(data.address || '');
          setGstNumber(data.gstNumber || '');
          setStateName(data.state || 'Maharashtra (27)');

          setBankName(data.bankName || 'HDFC BANK');
          setAccountNumber(data.accountNumber || '50200012345678');
          setIfscCode(data.ifscCode || 'HDFC0001234');
          setBranchName(data.branchName || 'Mumbai Branch');

          setQuotationPrefix(data.quotationPrefix || 'QT-');
          setDefaultCurrency(data.defaultCurrency || 'INR');
          setDefaultGstRate(data.defaultGstRate || 18);
          setDefaultPaymentTerms(data.defaultPaymentTerms || '');

          if (data.defaultTerms) {
            try {
              const parsed = typeof data.defaultTerms === 'string' ? JSON.parse(data.defaultTerms) : data.defaultTerms;
              if (Array.isArray(parsed)) {
                setTerms(parsed.join('\n'));
              } else {
                setTerms(data.defaultTerms);
              }
            } catch (e) {
              setTerms(data.defaultTerms);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const termsList = terms
        .split('\n')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch('/api/settings/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          logo,
          email,
          phone,
          website,
          address,
          gstNumber,
          state: stateName,
          bankName,
          accountNumber,
          ifscCode,
          branchName,
          quotationPrefix,
          defaultCurrency,
          defaultGstRate,
          defaultPaymentTerms,
          defaultTerms: termsList,
        }),
      });

      if (!res.ok) throw new Error('Failed to update company profile settings');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Settings">
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading CRM settings...</p>
        </div>
      </AppLayout>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <AppLayout title="Settings">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Personal Settings Banner Card (All Users) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Account Settings</h2>
              <p className="text-xs text-slate-500">Manage your full name, email, and security password</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors shrink-0"
          >
            <span>Manage Profile & Password</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* System Settings Card */}
        {!isAdmin ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">System & Company Settings Restricted</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              System branding, bank details, and quotation defaults are managed exclusively by Administrators.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">System & Company Settings</h1>
                  <p className="text-xs text-slate-500">Manage company branding, contact & bank details, and quotation defaults</p>
                </div>
              </div>

              {saveSuccess && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Saved Successfully!
                </span>
              )}
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Section 1: Branding & Logo */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  Company Branding & Logo
                </h2>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-40 h-24 bg-white border border-slate-300 rounded-xl p-2 flex items-center justify-center shrink-0 shadow-sm">
                    {logo ? (
                      <img src={logo} alt="Company Logo Preview" className="max-h-20 max-w-full object-contain" />
                    ) : (
                      <span className="text-slate-400 text-xs">No Logo</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <label className="block font-semibold text-slate-700">Logo Image Path or URL</label>
                    <input
                      type="text"
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      placeholder="/logo.png or https://example.com/logo.png"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500">
                      Default logo is set to <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">/logo.png</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Company Info */}
              <div className="space-y-4 pt-2">
                <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                  Company Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">GSTIN / Registration No.</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder="27AAAAA0000A1Z5"
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State & Code</label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="Maharashtra (27)"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Section 3: Company Bank Details */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Company Bank Account Details (Printed on Quotations)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="HDFC BANK"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="50200012345678"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="HDFC0001234"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="Mumbai Branch"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Quotation Defaults */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                  Quotation Defaults & Terms
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Quotation Prefix</label>
                    <input
                      type="text"
                      value={quotationPrefix}
                      onChange={(e) => setQuotationPrefix(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default Currency</label>
                    <select
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold bg-white"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default GST Rate (%)</label>
                    <select
                      value={defaultGstRate}
                      onChange={(e) => setDefaultGstRate(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold bg-white"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Payment Terms</label>
                  <input
                    type="text"
                    value={defaultPaymentTerms}
                    onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Terms & Conditions (One condition per line)
                  </label>
                  <textarea
                    rows={4}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-xs leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Save System Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
