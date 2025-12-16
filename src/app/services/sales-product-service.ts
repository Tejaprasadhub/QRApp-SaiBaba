// src/app/services/product.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where, limit, startAfter, orderBy, DocumentData, QueryDocumentSnapshot } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface Product {
  id: string;
  name: string;
  price: number;
  sellingPrice?: number;
  stock?: number;
  minStock?: number;
  categoryName?: string;
    subcategoryName?: string;
}

@Injectable({ providedIn: 'root' })
export class SalesProductService {
  constructor(private firestore: Firestore) {}

  /**
   * Fetch products with server-side filtering and cursor-based pagination
   */
  getProducts(filter: {
    name?: string;
    category?: string;
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  } = {}): Observable<{ data: Product[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
    const productsRef = collection(this.firestore, 'products');

    let q = query(productsRef, orderBy('name'));
if (filter.name) {
       q = query(
        productsRef,
        where('keywords', 'array-contains', filter.name.toLowerCase())
      );
    }

    if (filter.category) {
      q = query(q, where('categoryName', '==', filter.category));
    }

    if (filter.lastDoc) {
      q = query(q, startAfter(filter.lastDoc));
    }

    if (filter.pageSize) {
      q = query(q, limit(filter.pageSize));
    }

    return collectionData(q, { idField: 'id' }).pipe(
      map((data: DocumentData[]) => {
        const products = data as Product[];
        const lastDoc = products.length ? products[products.length - 1] : undefined;
        return { data: products, lastDoc: lastDoc as any };
      })
    );
  }
}
