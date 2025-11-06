import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, where } from '@angular/fire/firestore';
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
    const ref = collection(this.firestore, 'products');
    return addDoc(ref, p);
  }

  updateProduct(id: string, data: any) {
    const ref = doc(this.firestore, `products/${id}`);
    return updateDoc(ref, data);
  }

  deleteProduct(id: string) {
    const ref = doc(this.firestore, `products/${id}`);
    return deleteDoc(ref);
  }
}
