import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private firestore: Firestore) {}

  getCategories(): Observable<any[]> {
    const ref = collection(this.firestore, 'categories');
    return collectionData(ref, { idField: 'id' });
  }

  addCategory(cat: any) {
    const ref = collection(this.firestore, 'categories');
    return addDoc(ref, { ...cat, createdAt: new Date() });
  }

  updateCategory(id: string, data: any) {
    const ref = doc(this.firestore, `categories/${id}`);
    return updateDoc(ref, data);
  }

  deleteCategory(id: string) {
    const ref = doc(this.firestore, `categories/${id}`);
    return deleteDoc(ref);
  }
}
