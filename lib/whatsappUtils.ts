/**
 * Helper utility for WhatsApp 1-Click integration
 */
import { format, parseISO } from 'date-fns';

export function getWhatsAppNumber(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `91${clean}`;
  }
  return clean;
}

export function createWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = getWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

export function formatNiceDate(dateStr: string): string {
  try {
    if (dateStr && dateStr.includes('-')) {
      const parsed = parseISO(dateStr);
      return format(parsed, 'dd MMM yyyy');
    }
  } catch (e) {}
  return dateStr;
}

export function formatNiceTime(timeStr: string): string {
  try {
    if (timeStr && timeStr.includes(':')) {
      const [hoursStr, minutesStr] = timeStr.split(':');
      let hours = parseInt(hoursStr, 10);
      const minutes = minutesStr || '00';
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
      return `${formattedHours}:${minutes} ${ampm}`;
    }
  } catch (e) {}
  return timeStr;
}

export function getDemoWhatsAppLink(demo: {
  lead: { name: string; mobile: string };
  demoDate: string;
  demoTime: string;
  demoLink?: string | null;
}): string {
  const niceDate = formatNiceDate(demo.demoDate);
  const niceTime = formatNiceTime(demo.demoTime);
  const meetingLink = demo.demoLink ? demo.demoLink : '[Link will be shared shortly]';

  const msg = `Hi ${demo.lead.name},

Here are your product demo schedule details:

📅 Date: ${niceDate}
⏰ Time: ${niceTime}
🔗 Meeting Link: ${meetingLink}

Please let us know if you need to adjust the time. Thank you!`;

  return createWhatsAppLink(demo.lead.mobile, msg);
}

export function getLeadWhatsAppLink(
  lead: {
    id?: string;
    name: string;
    mobile: string;
    company?: string | null;
    quotations?: any[];
  }
): string {
  const msg = `Hi ${lead.name},

Thank you for connecting with us! 

When would be a convenient time for a quick call regarding your requirements?

Thank you!`;

  return createWhatsAppLink(lead.mobile, msg);
}

export function getQuotationWhatsAppLink(
  quotation: {
    id: string;
    quotationNumber: string;
    projectTitle: string;
    grandTotal: number;
    lead?: { name: string; mobile: string; company?: string | null };
    name?: string;
    mobile?: string;
  },
  baseUrl?: string
): string {
  let host = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  if (host.includes('localhost') && host.startsWith('https://')) {
    host = host.replace('https://', 'http://');
  }
  const pdfUrl = `${host}/quotations/${quotation.id}`;

  const clientName = quotation.lead?.name || quotation.name || 'Valued Client';
  const clientMobile = quotation.lead?.mobile || quotation.mobile || '';
  const projectTitle = quotation.projectTitle || 'Project Proposal';
  const quotationNumber = quotation.quotationNumber || 'QT';
  const amount = (quotation.grandTotal || 0).toLocaleString('en-IN');

  const msg = `Hi ${clientName},

Here is your official Quotation PDF document for *${projectTitle}*:

📄 *Quotation No:* ${quotationNumber}
💰 *Total Amount:* ₹${amount}

🔗 *Click to View & Download PDF Quotation:*
${pdfUrl}

Please review the quotation document and let us know if you need any adjustments or clarification. Thank you!`;

  return createWhatsAppLink(clientMobile, msg);
}

export function getFollowUpWhatsAppLink(followUp: {
  lead: { name: string; mobile: string };
  followUpDate: string;
  notes?: string | null;
}): string {
  const niceDate = formatNiceDate(followUp.followUpDate);
  const msg = `Hi ${followUp.lead.name},

This is a gentle follow-up regarding our discussion scheduled for ${niceDate}.

${followUp.notes ? `Note: ${followUp.notes}\n\n` : ''}Please let us know when you'd be available for a quick call. Thank you!`;

  return createWhatsAppLink(followUp.lead.mobile, msg);
}

export function getClientWhatsAppLink(client: {
  name: string;
  mobile: string;
  company?: string | null;
}): string {
  const msg = `Hi ${client.name},

Hope you are doing well!

We are checking in to see how everything is going${client.company ? ` with ${client.company}` : ''}. Please let us know if you need any support or assistance.

Thank you!`;

  return createWhatsAppLink(client.mobile, msg);
}


