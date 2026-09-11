/**
 * Utility for client-side PDF generation, downloading, and native file sharing.
 */

// Dynamically load html2pdf script if not already present in browser
export async function loadHtml2Pdf(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if ((window as any).html2pdf) return (window as any).html2pdf;

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('html2pdf-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).html2pdf));
      return;
    }

    const script = document.createElement('script');
    script.id = 'html2pdf-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve((window as any).html2pdf);
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

/**
 * Generate PDF Blob or trigger download for an HTML element
 */
export async function generateQuotationPDF(
  elementId: string = 'quotation-document-container',
  filename: string = 'Quotation.pdf'
): Promise<Blob | null> {
  try {
    const html2pdf = await loadHtml2Pdf();
    const element = document.getElementById(elementId) || document.querySelector('.quotation-print-container');
    if (!element) return null;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    if (html2pdf) {
      const pdfWorker = html2pdf().set(opt).from(element);
      const pdfBlob = await pdfWorker.output('blob');
      return pdfBlob;
    }
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
  return null;
}

/**
 * Direct PDF Download helper
 */
export async function downloadQuotationPDF(
  elementId: string = 'quotation-document-container',
  filename: string = 'Quotation.pdf'
): Promise<boolean> {
  try {
    const html2pdf = await loadHtml2Pdf();
    const element = document.getElementById(elementId) || document.querySelector('.quotation-print-container');
    if (!element) return false;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    if (html2pdf) {
      await html2pdf().set(opt).from(element).save();
      return true;
    }
  } catch (err) {
    console.error('Error downloading PDF:', err);
  }
  return false;
}

/**
 * Share PDF natively on mobile or auto-download & open WhatsApp link on desktop
 */
export async function handleShareQuotationWhatsApp(
  quotation: {
    id: string;
    quotationNumber: string;
    projectTitle: string;
    grandTotal: number;
    lead?: { name: string; mobile: string; company?: string | null };
    name?: string;
    mobile?: string;
  },
  whatsAppUrl: string
) {
  const filename = `Quotation_${quotation.quotationNumber || 'Doc'}.pdf`;

  // 1. Generate PDF blob from document container
  const blob = await generateQuotationPDF('quotation-document-container', filename);

  if (blob) {
    const file = new File([blob], filename, { type: 'application/pdf' });

    // 2. Check native file share on Mobile Devices (iOS Safari / Android Chrome)
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          title: `Quotation ${quotation.quotationNumber}`,
          text: `Quotation PDF for ${quotation.projectTitle}`,
          files: [file],
        });
        return;
      } catch (err) {
        // Fallback if user cancels mobile share prompt
      }
    }

    // 3. Fallback for Desktop: Auto-download PDF to user's computer
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 4. Open WhatsApp Web / App pre-filled
  if (typeof window !== 'undefined') {
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
  }
}
