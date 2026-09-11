import { adminDb } from './admin';
import { db } from './config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

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

// Server-side Firestore Write (Uses Firebase Admin SDK - instant, no key check block)
export async function syncToFirestore(collectionName: string, docId: string, data: any) {
  try {
    const cleanData = sanitizeData({
      ...data,
      syncedAt: new Date().toISOString(),
    });
    await adminDb.collection(collectionName).doc(docId).set(cleanData, { merge: true });
    console.log(`[Admin Firestore Sync Success] ${collectionName}/${docId}`);
  } catch (error) {
    console.warn(`[Firestore Sync Warning] (${collectionName}/${docId}):`, error);
  }
}

// Server-side Firestore Delete
export async function deleteFromFirestore(collectionName: string, docId: string) {
  try {
    await adminDb.collection(collectionName).doc(docId).delete();
  } catch (error) {
    console.warn(`[Firestore Delete Warning] (${collectionName}/${docId}):`, error);
  }
}

// Client-side Real-time listener helper
export function subscribeToCollection(
  collectionName: string,
  onUpdate: (docs: any[]) => void,
  maxLimit: number = 50
) {
  try {
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

// Server-side Firestore Reader (Uses Firebase Admin SDK)
export async function getFirestoreDocs(collectionName: string): Promise<any[]> {
  try {
    const snapshot = await adminDb.collection(collectionName).get();
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
    return items;
  } catch (error) {
    console.warn(`[Firestore Fetch Error] (${collectionName}):`, error);
    return [];
  }
}
