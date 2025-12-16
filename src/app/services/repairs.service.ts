import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  startAfter,
  limit,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RepairsService {
  constructor(private firestore: Firestore) {}

 getRepairs(
    filters: {
      status?: string;
      search?: string;
      start: Date;
      end: Date;
    },
    pageSize: number,
    lastDoc: any,
    realtime: boolean
  ): Observable<any[]> {

    const ref = collection(this.firestore, 'repairs');

    let q: any = query(
      ref,
      where('inDate', '>=', Timestamp.fromDate(filters.start)),
      where('inDate', '<=', Timestamp.fromDate(filters.end)),
      orderBy('inDate', 'desc'),
      limit(pageSize)
    );

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    // ✅ REALTIME
    if (realtime) {
      return collectionData(q, { idField: 'id' });
    }

    // ✅ NON-realtime (one time fetch)
    return from(
      getDocs(q).then(snap =>
        snap.docs.map(d => ({ id: d.id, 
          ...(d.data() as any) }))
      )
    );
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

  // Update service amount
  async updateServiceAmount(repairId: string, newServiceAmount: number) {
   const ref = doc(this.firestore, `repairs/${repairId}`);

    await updateDoc(ref, {
      serviceAmount: newServiceAmount
    });
}
}
