import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  addDoc
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class RepairsService {
  constructor(private firestore: Firestore) {}

  getRepairs() {
    const ref = collection(this.firestore, 'repairs');
    return collectionData(ref, { idField: 'id' });
  }

  // ===============================
  // Add Payment (Anytime)
  // ===============================
  async updatePayment(id: string, paid: number, pending: number) {
    const ref = doc(this.firestore, `repairs/${id}`);
    await updateDoc(ref, {
      paidAmount: paid,
      pendingAmount: pending
    });
  }

  // ===============================
  // Complete Job + Accept Payment
  // ===============================
  async markCompleted(id: string, paid: number, pending: number) {
    const ref = doc(this.firestore, `repairs/${id}`);

    await updateDoc(ref, {
      paidAmount: paid,
      pendingAmount: pending,
      status: pending === 0 ? 'completed' : 'completed', // still completed
      completedAt: new Date()
    });
  }
}
