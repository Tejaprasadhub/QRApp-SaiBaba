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

  // First, split by spaces
  const spaceParts = text.split(/\s+/).filter(Boolean);

  for (let part of spaceParts) {
    // Then, split each part by non-alphanumeric characters
    const subParts = part.split(/[^a-z0-9]+/).filter(Boolean);

    for (let subPart of subParts) {
      // Skip empty strings just in case
      if (!subPart) continue;

      // Generate progressive prefixes
      let current = '';
      for (let char of subPart) {
        current += char;
        keywords.add(current);
      }

      // Add full token explicitly
      keywords.add(subPart);
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

    // 📌 CASE 1 — SEARCH MODE (keyword search)
    // Firestore DOES NOT allow:
    // array-contains + orderBy + startAfter
    if (filters.name) {
      let searchQ: any = query(
        ref,
        where('keywords', 'array-contains', filters.name.toLowerCase())
      );

      // Apply category filters (allowed)
      if (filters.categoryId) {
        searchQ = query(searchQ, where('categoryId', '==', filters.categoryId));
      }

      if (filters.subcategoryId) {
        searchQ = query(searchQ, where('subcategoryId', '==', filters.subcategoryId));
      }

      // ❗ No pagination & No ordering allowed
      const snapshot = await getDocs(searchQ);

      return {
        products: snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })),
        lastDoc: null, // No pagination possible
      };
    }

    // 📌 CASE 2 — NORMAL MODE (no keyword search)
    // Pagination + orderBy works normally
    let q: any = query(ref);

    if (filters.categoryId) {
      q = query(q, where('categoryId', '==', filters.categoryId));
    }

    if (filters.subcategoryId) {
      q = query(q, where('subcategoryId', '==', filters.subcategoryId));
    }

    // Pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    // Order + limit
    q = query(q, orderBy('name'), limit(pageSize));

    const snapshot = await getDocs(q);

    return {
      products: snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
      })),
      lastDoc: snapshot.docs.at(-1) || null,
    };
  }
}
