import { db } from './config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'neurosales-b07f9';
const REST_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function parseFirestoreFields(fields: any): any {
  if (!fields) return {};
  const obj: any = {};
  for (const [key, val] of Object.entries(fields) as [string, any][]) {
    if (val.stringValue !== undefined) obj[key] = val.stringValue;
    else if (val.integerValue !== undefined) obj[key] = parseInt(val.integerValue, 10);
    else if (val.doubleValue !== undefined) obj[key] = parseFloat(val.doubleValue);
    else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
    else if (val.nullValue !== undefined) obj[key] = null;
    else if (val.timestampValue !== undefined) obj[key] = val.timestampValue;
    else if (val.mapValue !== undefined) obj[key] = parseFirestoreFields(val.mapValue.fields);
    else if (val.arrayValue !== undefined) {
      obj[key] = (val.arrayValue.values || []).map((item: any) =>
        item.mapValue
          ? parseFirestoreFields(item.mapValue.fields)
          : item.stringValue !== undefined
          ? item.stringValue
          : item.integerValue !== undefined
          ? parseInt(item.integerValue, 10)
          : item
      );
    }
  }
  return obj;
}

function convertToFirestoreFields(obj: any): any {
  const fields: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((item) => {
            if (typeof item === 'object' && item !== null) {
              return { mapValue: { fields: convertToFirestoreFields(item) } };
            }
            if (typeof item === 'number') {
              return Number.isInteger(item) ? { integerValue: String(item) } : { doubleValue: item };
            }
            if (typeof item === 'boolean') {
              return { booleanValue: item };
            }
            return { stringValue: String(item) };
          }),
        },
      };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: convertToFirestoreFields(val) } };
    }
  }
  return fields;
}

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

// Server-side Firestore Write (Uses REST API for zero-credential Vercel compatibility)
export async function syncToFirestore(collectionName: string, docId: string, data: any) {
  try {
    const cleanData = sanitizeData({
      ...data,
      syncedAt: new Date().toISOString(),
    });

    const url = `${REST_BASE_URL}/${collectionName}/${docId}`;
    const fields = convertToFirestoreFields(cleanData);

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });

    if (res.ok) {
      console.log(`[Firestore REST Sync Success] ${collectionName}/${docId}`);
      return;
    }

    // Try fallback via adminDb if present
    try {
      const { adminDb } = await import('./admin');
      await adminDb.collection(collectionName).doc(docId).set(cleanData, { merge: true });
    } catch (e) {}
  } catch (error) {
    console.warn(`[Firestore Sync Warning] (${collectionName}/${docId}):`, error);
  }
}

// Server-side Firestore Delete
export async function deleteFromFirestore(collectionName: string, docId: string) {
  try {
    const url = `${REST_BASE_URL}/${collectionName}/${docId}`;
    await fetch(url, { method: 'DELETE' });
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

// Server-side Firestore Reader (Uses REST API for zero-credential Vercel compatibility)
export async function getFirestoreDocs(collectionName: string): Promise<any[]> {
  try {
    const url = `${REST_BASE_URL}/${collectionName}?pageSize=300`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Firestore REST Fetch HTTP Error ${res.status}] (${collectionName})`);
      return [];
    }

    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) {
      return [];
    }

    const items = data.documents.map((d: any) => {
      const id = d.name.split('/').pop();
      return { id, ...parseFirestoreFields(d.fields) };
    });

    console.log(`[Firestore REST Fetch Success] Loaded ${items.length} docs from ${collectionName}`);
    return items;
  } catch (error) {
    console.warn(`[Firestore REST Fetch Error] (${collectionName}):`, error);
    return [];
  }
}
