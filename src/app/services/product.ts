import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private firestore: Firestore) {}

public generateKeywords(text: string): string[] {
  text = (text || '').toLowerCase().trim();

  const keywords = new Set<string>();
  if (!text) return [];

  // 1. Split ONLY by slash (/) NOT by all non-alphanumeric chars
  const firstSplit = text.split(/\//).map(t => t.trim()).filter(Boolean);

  for (let chunk of firstSplit) {

    // Add the chunk exactly as is (e.g., "a04e f02s")
    keywords.add(chunk);

    // 2. Split the chunk by spaces
    const spaceParts = chunk.split(/\s+/).filter(Boolean);

    // Add each space-split part
    for (let part of spaceParts) {
      keywords.add(part);
    }
  }

  return Array.from(keywords);
}


  getProducts(): Observable<any[]> {
    const ref = collection(this.firestore, 'products');
    return collectionData(ref, { idField: 'id' });
  }

  getProductsByCategory(categoryId: string) {
    const ref = collection(this.firestore, 'products');
    const q = query(ref, where('categoryId', '==', categoryId));
    return collectionData(q, { idField: 'id' });
  }

  // ----------------------------
  // 🔥 ADD PRODUCT with keywords
  // ----------------------------
  addProduct(p: any) {
    p.keywords = this.generateKeywords(p.name);
    return addDoc(collection(this.firestore, 'products'), p);
  }

  // ----------------------------
  // 🔥 UPDATE PRODUCT with keyword regeneration
  // ----------------------------
  updateProduct(id: string, data: any) {
    if (data.name) {
      data.keywords = this.generateKeywords(data.name);
    }
    return updateDoc(doc(this.firestore, `products/${id}`), data);
  }

  deleteProduct(id: string) {
    return deleteDoc(doc(this.firestore, `products/${id}`));
  }

  // ---------------------------------------------------------------
  // ✅ Accurate Firestore COUNT()
  // ---------------------------------------------------------------
  async getProductsCount(filters: any): Promise<number> {
    let ref = collection(this.firestore, 'products');
    let q: any = query(ref);

    // Keyword filter
    if (filters.name) {
      q = query(q, where('keywords', 'array-contains', filters.name.toLowerCase()));
    }

    if (filters.categoryId) {
      q = query(q, where('categoryId', '==', filters.categoryId));
    }

    if (filters.subcategoryId) {
      q = query(q, where('subcategoryId', '==', filters.subcategoryId));
    }

    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }

    // ---------------------------------------------------------------
  // Pagination + Filters (with keyword search special handling)
  // ---------------------------------------------------------------
  async getProductsPaginated(filters: any, pageSize: number, lastDoc: any = null) {
    const ref = collection(this.firestore, 'products');

    // 📌 CASE 1 — NAME FILTER APPLIED → CLIENT-SIDE PAGINATION MODE
    // Because Firestore cannot paginate on array-contains
    if (filters.name) {
      let q: any = query(
        ref,
        where('keywords', 'array-contains', filters.name.toLowerCase())
      );

      if (filters.categoryId) {
        q = query(q, where('categoryId', '==', filters.categoryId));
      }

      if (filters.subcategoryId) {
        q = query(q, where('subcategoryId', '==', filters.subcategoryId));
      }

      const snapshot = await getDocs(q);

      // Return *all products* — UI will paginate
      return {
        mode: 'client',
        products: snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
        lastDoc: null
      };
    }

    // 📌 CASE 2 — NORMAL FILTERS → SERVER-SIDE PAGINATION
    let q: any = query(ref);

    if (filters.categoryId) {
      q = query(q, where('categoryId', '==', filters.categoryId));
    }

    if (filters.subcategoryId) {
      q = query(q, where('subcategoryId', '==', filters.subcategoryId));
    }

    // 🔥 Order must be applied BEFORE startAfter
q = query(q, orderBy('name'));

// 🔥 Apply cursor AFTER orderBy
if (lastDoc) {
  q = query(q, startAfter(lastDoc));
}

// Finally apply limit
q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);

    return {
      mode: 'server',
      products: snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
      })),
      lastDoc: snapshot.docs.at(-1) || null
    };
  }

}
