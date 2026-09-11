'use client';

import React from 'react';

interface QuotationDocumentProps {
  quotation: any;
  companyDetails?: any;
}

export const QuotationDocument: React.FC<QuotationDocumentProps> = ({
  quotation,
  companyDetails,
}) => {
  if (!quotation) return null;

  // Parse snapshots or fallback
  let company = companyDetails;
  if (!company && quotation.companySnapshot) {
    try {
      company =
        typeof quotation.companySnapshot === 'string'
          ? JSON.parse(quotation.companySnapshot)
          : quotation.companySnapshot;
    } catch (e) {}
  }
  if (!company) {
    company = {
      companyName: 'NEURONEXUS NEXT-GEN INTELLIGENCE',
      logo: '/logo.jpg',
      email: 'contact@neuronexus.ai',
      phone: '+91 98765 43210',
      website: 'https://neuronexus.ai',
      address: '123 Tech Park, Suite 400, Mumbai, India',
      gstNumber: '27AAAAA0000A1Z5',
      state: 'Maharashtra (27)',
      bankName: 'HDFC BANK',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
      branchName: 'Mumbai Branch',
    };
  }

  const logoSrc = company.logo && company.logo.trim() !== '' ? company.logo : '/logo.jpg';
  const watermarkSrc = logoSrc.endsWith('.png') ? '/logo.jpg' : logoSrc;

  let client = quotation.lead;
  if (quotation.clientSnapshot) {
    try {
      client =
        typeof quotation.clientSnapshot === 'string'
          ? JSON.parse(quotation.clientSnapshot)
          : quotation.clientSnapshot;
    } catch (e) {}
  }

  let termsList: string[] = [];
  if (quotation.termsSnapshot) {
    try {
      termsList =
        typeof quotation.termsSnapshot === 'string'
          ? JSON.parse(quotation.termsSnapshot)
          : quotation.termsSnapshot;
    } catch (e) {
      if (typeof quotation.termsSnapshot === 'string') termsList = [quotation.termsSnapshot];
    }
  }
  if (termsList.length === 0) {
    termsList = [
      '50% advance payment is required before project commencement.',
      'Remaining balance is due upon final project delivery/completion.',
      'Quotation validity is 15 days from the date of issue.',
      'Additional feature requests outside agreed scope will be billed separately.',
    ];
  }

  return (
    <div id="quotation-document-container" className="quotation-print-container relative bg-white text-slate-900 font-sans p-6 md:p-10 max-w-4xl mx-auto printable-document overflow-hidden">
      {/* Official Company Logo Image Watermark Overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden select-none"
        style={{ pointerEvents: 'none' }}
      >
        <img
          src={watermarkSrc}
          alt="Watermark"
          className="w-[440px] md:w-[500px] max-w-[85%] object-contain transform -rotate-12"
          style={{ opacity: 0.16, mixBlendMode: 'multiply' }}
        />
      </div>

      {/* Main Document Content Frame */}
      <div className="relative z-10">
        {/* Top Project Title (Centered) */}
        <h1 className="text-xl md:text-2xl font-black text-center text-slate-900 uppercase tracking-wide mb-3">
          {quotation.projectTitle || 'PROJECT QUOTATION'}
        </h1>

        {/* Main Boxed Layout Frame */}
        <div className="border-2 border-slate-900 divide-y-2 divide-slate-900 bg-white">
          
          {/* Header Grid: Logo (Left) | Company Info (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900">
            {/* Logo Box */}
            <div className="p-4 flex flex-col items-center justify-center bg-slate-50/50 text-center min-h-[110px]">
              <img
                src={logoSrc}
                alt={company.companyName || 'NEURONEXUS'}
                className="max-h-20 w-auto object-contain mb-1"
              />
            </div>

            {/* Company Details Box */}
            <div className="p-4 text-xs space-y-1 bg-white">
              <h2 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                {company.companyName || 'NEURONEXUS NEXT-GEN INTELLIGENCE'}
              </h2>
              <p className="text-slate-700 leading-snug">{company.address || '123 Tech Park, Suite 400, Mumbai, India'}</p>
              <div className="pt-1 text-[11px] text-slate-800 space-y-0.5 font-mono">
                <p><strong className="font-semibold text-slate-900">Mobile:</strong> {company.phone || '+91 98765 43210'}</p>
                <p><strong className="font-semibold text-slate-900">Email:</strong> {company.email || 'contact@neuronexus.ai'}</p>
                <p><strong className="font-semibold text-slate-900">GSTIN:</strong> {company.gstNumber || '27AAAAA0000A1Z5'}</p>
                <p><strong className="font-semibold text-slate-900">State:</strong> {company.state || 'Maharashtra (27)'}</p>
              </div>
            </div>
          </div>

          {/* Estimate Details & Client Info Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900">
            {/* Estimate For / Bill To */}
            <div className="p-4 text-xs space-y-1 bg-white">
              <h3 className="font-bold text-slate-900 text-xs uppercase border-b border-slate-900 pb-1 mb-2 tracking-wider">
                Estimate For:
              </h3>
              <p className="font-extrabold text-sm text-slate-900">{client?.name || quotation.lead?.name}</p>
              {client?.company && <p className="font-semibold text-slate-800">{client.company}</p>}
              <p className="font-mono text-slate-700">Phone: {client?.mobile || quotation.lead?.mobile}</p>
              {client?.email && <p className="text-slate-700">Email: {client.email}</p>}
              {client?.city && <p className="text-slate-700">City / Location: {client.city}</p>}
            </div>

            {/* Estimate Details */}
            <div className="p-4 text-xs space-y-1 bg-white">
              <h3 className="font-bold text-slate-900 text-xs uppercase border-b border-slate-900 pb-1 mb-2 tracking-wider">
                Estimate Details:
              </h3>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                <span className="font-bold text-slate-700">Estimate No:</span>
                <span className="font-mono font-extrabold text-slate-900">{quotation.quotationNumber}</span>

                <span className="font-bold text-slate-700">Estimate Date:</span>
                <span className="font-mono text-slate-800">{quotation.quotationDate}</span>

                <span className="font-bold text-slate-700">Valid Until:</span>
                <span className="font-mono text-slate-800">{quotation.validUntil}</span>

                <span className="font-bold text-slate-700">Status:</span>
                <span className="font-bold text-indigo-700 uppercase">{quotation.status}</span>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-900 font-bold uppercase text-[11px] text-slate-900 divide-x-2 divide-slate-900">
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-3">Item & Description</th>
                  <th className="py-2.5 px-3 text-center w-24">HSN/SAC</th>
                  <th className="py-2.5 px-3 text-center w-16">Qty</th>
                  <th className="py-2.5 px-3 text-right w-28">Price/Unit (₹)</th>
                  <th className="py-2.5 px-3 text-right w-24">Discount (₹)</th>
                  <th className="py-2.5 px-3 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 bg-white">
                {quotation.items?.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="divide-x-2 divide-slate-900 text-slate-900">
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block text-xs">{item.name}</span>
                      {item.description && (
                        <span className="text-slate-600 text-[11px] block mt-0.5 leading-snug">
                          {item.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600 text-[11px]">
                      {item.hsnCode || '-'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {item.discountAmount > 0 ? `₹${item.discountAmount.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{item.total?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Footer Row inside table */}
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-900 divide-x-2 divide-slate-900 font-bold text-slate-900 text-xs">
                  <td colSpan={3} className="py-2.5 px-3">
                    Total Items: <span className="font-mono">{quotation.items?.length || 0}</span>
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 text-right uppercase">
                    Sub Total:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 text-sm">
                    ₹{quotation.subtotal?.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Lower Grid: Left (Terms & Conditions + Bank Details) | Right (Totals + Amount in Words + Signature) */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900">
            
            {/* Left Column: Terms & Conditions + Bank Details */}
            <div className="p-4 text-xs space-y-4 bg-white flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase border-b border-slate-900 pb-1 mb-2 tracking-wider">
                  Terms And Conditions:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-800 leading-relaxed text-[11px]">
                  {termsList.map((term, idx) => (
                    <li key={idx} className="pl-0.5">{term}</li>
                  ))}
                </ol>
              </div>

              {/* Bank Details Box */}
              <div className="border border-slate-900 p-3 bg-slate-50/90 rounded-xs text-[11px] space-y-1 font-mono">
                <h5 className="font-bold text-slate-900 text-xs uppercase font-sans border-b border-slate-400 pb-1 mb-1.5 tracking-wider">
                  BANK DETAILS
                </h5>
                <p><strong className="font-sans font-bold text-slate-800">BANK:</strong> {company.bankName || 'HDFC BANK'}</p>
                <p><strong className="font-sans font-bold text-slate-800">A/C NO:</strong> {company.accountNumber || '50200012345678'}</p>
                <p><strong className="font-sans font-bold text-slate-800">IFSC CODE:</strong> {company.ifscCode || 'HDFC0001234'}</p>
                <p><strong className="font-sans font-bold text-slate-800">BRANCH:</strong> {company.branchName || 'Mumbai Branch'}</p>
                <p><strong className="font-sans font-bold text-slate-800">GST NO:</strong> {company.gstNumber || '27AAAAA0000A1Z5'}</p>
              </div>
            </div>

            {/* Right Column: Summary, Amount in Words, Authorized Signatory */}
            <div className="p-4 text-xs space-y-4 bg-white flex flex-col justify-between">
              {/* Calculations Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">Sub Total:</span>
                  <span className="font-mono font-bold text-slate-900">₹{quotation.subtotal?.toLocaleString('en-IN')}</span>
                </div>

                {(quotation.itemDiscountTotal > 0 || quotation.overallDiscountAmount > 0) && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-200 text-rose-700 font-medium">
                    <span>Total Discount:</span>
                    <span className="font-mono">
                      -₹{(quotation.itemDiscountTotal + (quotation.overallDiscountAmount || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="font-semibold text-slate-700">GST Total (18%):</span>
                  <span className="font-mono font-bold text-slate-900">₹{quotation.taxTotal?.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-100 border border-slate-900 rounded-xs font-black text-sm text-slate-900">
                  <span className="uppercase">Grand Total:</span>
                  <span className="font-mono text-base text-indigo-900">
                    ₹{quotation.grandTotal?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Amount in Words */}
              {quotation.amountInWords && (
                <div className="border border-slate-900 p-2.5 bg-slate-50/70 rounded-xs">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                    Amount In Words:
                  </span>
                  <span className="font-bold text-slate-900 text-xs italic block mt-0.5 font-serif">
                    {quotation.amountInWords}
                  </span>
                </div>
              )}

              {/* Signature Box */}
              <div className="pt-8 text-right space-y-8">
                <p className="font-extrabold text-slate-900 text-xs">For {company.companyName || 'NEURONEXUS'}</p>
                <div className="border-b-2 border-slate-900 w-44 ml-auto pt-6" />
                <p className="text-slate-800 font-bold text-xs uppercase tracking-wider">Authorized Signatory</p>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
