import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Firestore Helper Service
 * Provides real-time synchronization for CRM records:
 * Leads, Calls, Follow-ups, Demos, Quotations, Clients, Projects, Activities, Settings.
 */

// Helper to convert JS Dates to Firestore ISO/Timestamps safely
function sanitizeData(data: any) {
  if (!data || typeof data !== 'object') return data;

  const sanitized: any = Array.isArray(data) ? [] : {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const val = data[key];
      if (val instanceof Date) {
        sanitized[key] = val.toISOString();
      } else if (val && typeof val === 'object' && !Array.isArray(val) && val.constructor?.name === 'Object') {
        sanitized[key] = sanitizeData(val);
      } else {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
}

// Safe Firestore write wrapper (won't crash app if keys not configured yet)
export async function syncToFirestore(collectionName: string, docId: string, data: any) {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'YOUR_FIREBASE_API_KEY') {
      return; // Skip if keys not filled in yet
    }
    const cleanData = sanitizeData({
      ...data,
      syncedAt: new Date().toISOString(),
    });
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.warn(`[Firestore Sync Warning] (${collectionName}/${docId}):`, error);
  }
}

// Safe Firestore delete wrapper
export async function deleteFromFirestore(collectionName: string, docId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'YOUR_FIREBASE_API_KEY') {
      return;
    }
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn(`[Firestore Delete Warning] (${collectionName}/${docId}):`, error);
  }
}

// Real-time collection listener helper
export function subscribeToCollection(
  collectionName: string,
  onUpdate: (docs: any[]) => void,
  maxLimit: number = 50
) {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'YOUR_FIREBASE_API_KEY') {
      return () => {};
    }
    const q = query(
      collection(db, collectionName),
      orderBy('createdAt', 'desc'),
      limit(maxLimit)
    );

    return onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      onUpdate(items);
    });
  } catch (error) {
    console.warn(`[Firestore Real-time Listener Warning] (${collectionName}):`, error);
    return () => {};
  }
}
