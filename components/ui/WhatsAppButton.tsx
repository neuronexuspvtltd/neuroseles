'use client';

import React from 'react';

interface WhatsAppButtonProps {
  href?: string;
  mobile?: string;
  name?: string;
  title?: string;
  className?: string;
  showText?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.019 4.842-1.27.001-.002z" />
  </svg>
);

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  href,
  mobile,
  name,
  title = 'Send WhatsApp Message',
  className = 'p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors',
  showText = false,
  onClick,
}) => {
  let targetUrl = href;
  if (!targetUrl && mobile) {
    const cleanMobile = mobile.replace(/\D/g, '');
    const fullMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
    const msg = encodeURIComponent(`Hello ${name || ''}, greeting from NEURONEXUS!`);
    targetUrl = `https://wa.me/${fullMobile}?text=${msg}`;
  }

  return (
    <a
      href={targetUrl || '#'}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={title}
    >
      <WhatsAppIcon className="w-4 h-4 text-emerald-600 shrink-0" />
      {showText && <span>WhatsApp PDF</span>}
    </a>
  );
};
