import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, where, doc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SubcategoryService {
  constructor(private firestore: Firestore) {}

  getSubcategories(): Observable<any[]> {
    const ref = collection(this.firestore, 'subcategories');
    return collectionData(ref, { idField: 'id' });
  }

  getByCategory(categoryId: string) {
    const ref = collection(this.firestore, 'subcategories');
    const q = query(ref, where('categoryId', '==', categoryId));
    return collectionData(q, { idField: 'id' });
  }

  add(sub: any) {
    const ref = collection(this.firestore, 'subcategories');
    return addDoc(ref, { ...sub, createdAt: new Date() });
  }

   // ✅ Add this delete method if missing
  deleteSubcategory(id: string) {
    const subcatDoc = doc(this.firestore, 'subcategories', id);
    return deleteDoc(subcatDoc);
  }
}
