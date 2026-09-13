import { prisma, ensureDatabaseTables } from '@/lib/prisma';
import { getFirestoreDocs } from './firestore';

export async function hydrateLeads() {
  try {
    await ensureDatabaseTables();
    const firestoreLeads = await getFirestoreDocs('leads');
    if (!firestoreLeads || firestoreLeads.length === 0) return;

    for (const item of firestoreLeads) {
      if (!item.id || !item.name || !item.mobile) continue;
      const normalizedMobile = item.normalizedMobile || item.mobile.replace(/\D/g, '');
      try {
        await prisma.lead.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            name: item.name,
            mobile: item.mobile,
            normalizedMobile: normalizedMobile || item.id,
            email: item.email || null,
            company: item.company || null,
            city: item.city || null,
            source: item.source || 'Direct',
            initialRequirements: item.initialRequirements || null,
            notes: item.notes || null,
            status: item.status || 'NEW',
            demoDate: item.demoDate || null,
            demoTime: item.demoTime || null,
            demoLink: item.demoLink || null,
            meetingId: item.meetingId || null,
            password: item.password || null,
            demoStatus: item.demoStatus || null,
            assignedToId: item.assignedToId || null,
            createdById: item.createdById || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          },
          update: {
            name: item.name || undefined,
            mobile: item.mobile || undefined,
            normalizedMobile: normalizedMobile || undefined,
            email: item.email !== undefined ? item.email : undefined,
            company: item.company !== undefined ? item.company : undefined,
            city: item.city !== undefined ? item.city : undefined,
            source: item.source || undefined,
            initialRequirements: item.initialRequirements !== undefined ? item.initialRequirements : undefined,
            notes: item.notes !== undefined ? item.notes : undefined,
            status: item.status || undefined,
            demoDate: item.demoDate !== undefined ? item.demoDate : undefined,
            demoTime: item.demoTime !== undefined ? item.demoTime : undefined,
            demoLink: item.demoLink !== undefined ? item.demoLink : undefined,
            meetingId: item.meetingId !== undefined ? item.meetingId : undefined,
            password: item.password !== undefined ? item.password : undefined,
            demoStatus: item.demoStatus !== undefined ? item.demoStatus : undefined,
          },
        });
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[Hydrate Leads Warning]:', err);
  }
}

export async function hydrateClients() {
  try {
    await ensureDatabaseTables();
    const firestoreClients = await getFirestoreDocs('clients');
    if (!firestoreClients || firestoreClients.length === 0) return;

    for (const item of firestoreClients) {
      if (!item.id || !item.name || !item.mobile) continue;
      const normalizedMobile = item.normalizedMobile || item.mobile.replace(/\D/g, '');
      try {
        await prisma.client.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            leadId: item.leadId || null,
            name: item.name,
            mobile: item.mobile,
            normalizedMobile: normalizedMobile || item.id,
            email: item.email || null,
            company: item.company || null,
            city: item.city || null,
            address: item.address || null,
            status: item.status || 'ACTIVE',
            notes: item.notes || null,
            clientSince: item.clientSince ? new Date(item.clientSince) : new Date(),
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          },
          update: {
            name: item.name || undefined,
            mobile: item.mobile || undefined,
            email: item.email !== undefined ? item.email : undefined,
            company: item.company !== undefined ? item.company : undefined,
            city: item.city !== undefined ? item.city : undefined,
            address: item.address !== undefined ? item.address : undefined,
            status: item.status || undefined,
            notes: item.notes !== undefined ? item.notes : undefined,
          },
        });
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[Hydrate Clients Warning]:', err);
  }
}

export async function hydrateCalls() {
  try {
    await ensureDatabaseTables();
    const firestoreCalls = await getFirestoreDocs('calls');
    if (!firestoreCalls || firestoreCalls.length === 0) return;

    for (const item of firestoreCalls) {
      if (!item.id || !item.leadId) continue;
      try {
        await prisma.call.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            leadId: item.leadId,
            callDate: item.callDate || new Date().toISOString().split('T')[0],
            callTime: item.callTime || '10:00 AM',
            callResult: item.callResult || 'Call Received',
            customerResponse: item.customerResponse || 'Interested',
            notes: item.notes || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          },
          update: {
            callDate: item.callDate || undefined,
            callTime: item.callTime || undefined,
            callResult: item.callResult || undefined,
            customerResponse: item.customerResponse || undefined,
            notes: item.notes !== undefined ? item.notes : undefined,
          },
        });
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[Hydrate Calls Warning]:', err);
  }
}

export async function hydrateDemos() {
  try {
    await ensureDatabaseTables();
    const firestoreDemos = await getFirestoreDocs('demos');
    if (!firestoreDemos || firestoreDemos.length === 0) return;

    for (const item of firestoreDemos) {
      if (!item.id || !item.leadId) continue;
      try {
        await prisma.demo.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            leadId: item.leadId,
            demoDate: item.demoDate || new Date().toISOString().split('T')[0],
            demoTime: item.demoTime || '11:00 AM',
            duration: item.duration || '30 mins',
            status: item.status || 'SCHEDULED',
            demoLink: item.demoLink || null,
            meetingId: item.meetingId || null,
            password: item.password || null,
            requirements: item.requirements || null,
            notes: item.notes || null,
            demoResult: item.demoResult || null,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          },
          update: {
            demoDate: item.demoDate || undefined,
            demoTime: item.demoTime || undefined,
            duration: item.duration || undefined,
            status: item.status || undefined,
            demoLink: item.demoLink !== undefined ? item.demoLink : undefined,
            meetingId: item.meetingId !== undefined ? item.meetingId : undefined,
            password: item.password !== undefined ? item.password : undefined,
            requirements: item.requirements !== undefined ? item.requirements : undefined,
            notes: item.notes !== undefined ? item.notes : undefined,
            demoResult: item.demoResult !== undefined ? item.demoResult : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          },
        });
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[Hydrate Demos Warning]:', err);
  }
}

export async function hydrateFollowUps() {
  try {
    await ensureDatabaseTables();
    const firestoreFollowUps = await getFirestoreDocs('followups');
    if (!firestoreFollowUps || firestoreFollowUps.length === 0) return;

    for (const item of firestoreFollowUps) {
      if (!item.id || !item.leadId) continue;
      try {
        await prisma.followUp.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            leadId: item.leadId,
            followUpDate: item.followUpDate || new Date().toISOString().split('T')[0],
            followUpTime: item.followUpTime || '10:00 AM',
            note: item.note || 'Follow up required',
            status: item.status || 'PENDING',
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          },
          update: {
            followUpDate: item.followUpDate || undefined,
            followUpTime: item.followUpTime || undefined,
            note: item.note !== undefined ? item.note : undefined,
            status: item.status || undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          },
        });
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[Hydrate FollowUps Warning]:', err);
  }
}

export async function hydrateQuotations() {
  try {
    await ensureDatabaseTables();
    const firestoreQuotations = await getFirestoreDocs('quotations');
    if (!firestoreQuotations || firestoreQuotations.length === 0) return;

    for (const item of firestoreQuotations) {
      if (!item.id || !item.leadId || !item.quotationNumber) continue;
      try {
        await prisma.quotation.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            leadId: item.leadId,
            quotationNumber: item.quotationNumber,
            projectTitle: item.projectTitle || 'Project Quotation',
            projectDescription: item.projectDescription || null,
            currency: item.currency || 'INR',
            quotationDate: item.quotationDate || new Date().toISOString().split('T')[0],
            validUntil: item.validUntil || new Date().toISOString().split('T')[0],
            status: item.status || 'DRAFT',
            grandTotal: item.grandTotal || 0,
            subtotal: item.subtotal || 0,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          },
          update: {
            projectTitle: item.projectTitle || undefined,
            projectDescription: item.projectDescription !== undefined ? item.projectDescription : undefined,
            quotationDate: item.quotationDate || undefined,
            validUntil: item.validUntil || undefined,
            status: item.status || undefined,
            grandTotal: item.grandTotal !== undefined ? item.grandTotal : undefined,
            subtotal: item.subtotal !== undefined ? item.subtotal : undefined,
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          },
        });
      } catch (e) {}
    }
  } catch (err) {
    console.warn('[Hydrate Quotations Warning]:', err);
  }
}
