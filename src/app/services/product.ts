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
  getCountFromServer
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private firestore: Firestore) {}

  getProducts(): Observable<any[]> {
    const ref = collection(this.firestore, 'products');
    return collectionData(ref, { idField: 'id' });
  }

  getProductsByCategory(categoryId: string) {
    const ref = collection(this.firestore, 'products');
    const q = query(ref, where('categoryId', '==', categoryId));
    return collectionData(q, { idField: 'id' });
  }

  addProduct(p: any) {
    return addDoc(collection(this.firestore, 'products'), p);
  }

  updateProduct(id: string, data: any) {
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

    if (filters.name) {
      q = query(
        q,
        where('name', '>=', filters.name),
        where('name', '<=', filters.name + '\uf8ff')
      );
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
  // Pagination
  // ---------------------------------------------------------------
  async getProductsPaginated(filters: any, pageSize: number, lastDoc: any = null) {
  let ref = collection(this.firestore, 'products');
  let q: any = query(ref);

  // NAME SEARCH
  if (filters.name) {
    q = query(
      q,
      where('name', '>=', filters.name),
      where('name', '<=', filters.name + '\uf8ff')
    );
  }

  // CATEGORY FILTER
  if (filters.categoryId) {
    q = query(q, where('categoryId', '==', filters.categoryId));
  }

  // SUBCATEGORY FILTER
  if (filters.subcategoryId) {
    q = query(q, where('subcategoryId', '==', filters.subcategoryId));
  }

  // 🔥 Pagination must be applied BEFORE ordering
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  // 🔥 Correct final order
  q = query(q, orderBy('name', 'desc'), limit(pageSize));

  const snapshot = await getDocs(q);

  return {
    products: snapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as any)
    })),
    lastDoc: snapshot.docs.at(-1) || null
  };
}

}
