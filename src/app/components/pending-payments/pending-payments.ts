import { Component } from '@angular/core';
import { Firestore, collection, query, where, updateDoc, doc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-pending-payments',
  standalone: false,
  templateUrl: './pending-payments.html',
  styleUrls: ['./pending-payments.scss']
})
export class PendingPayments {

  pendingList: any[] = [];

  constructor(private firestore: Firestore) {
    this.loadPendingPayments();
  }

  // ================================
  // 🔥 Get all pending payments
  // ================================
  // loadPendingPayments() {
  //   const ref = collection(this.firestore, 'sales');
  //   const q1 = query(ref, where('pendingAmount', '>', 0));

  //   collectionData(q1, { idField: 'id' }).subscribe(res => {
  //     this.pendingList = res.sort(
  //       (a, b) => b['date'].toDate() - a['date'].toDate()
  //     );
  //   });
  // }

 
loadPendingPayments() {
  const salesRef = collection(this.firestore, 'sales');
  const repairsRef = collection(this.firestore, 'repairs');

  const salesQ = query(salesRef, where('pendingAmount', '>', 0));
  const repairsQ = query(repairsRef, where('pendingAmount', '>', 0));

  combineLatest([
    collectionData(salesQ, { idField: 'id' }),
    collectionData(repairsQ, { idField: 'id' })
  ]).subscribe(([sales, repairs]: any[]) => {

    const formattedSales = sales.map((s:any) => ({
      ...s,
      type: 'Sale',
       total: s.total,
      paymentMode: s.paymentMode || '—',
      date: s.date
    }));

    const formattedRepairs = repairs.map((r:any) => ({
      ...r,
      type: 'Repair',
       total: r.estimatedAmount,          // ✅ map correctly
      paymentMode: 'Repair',              // ✅ default value
      date: r.inDate                      // ✅ map date
    }));

    this.pendingList = [...formattedSales, ...formattedRepairs]
      .sort((a, b) => b.date.toDate() - a.date.toDate());
  });
}


  // ================================
  // 🔆 Mark as fully paid
  // ================================
  async markAsPaid(item: any) {
    const ref = doc(this.firestore, `sales/${item.id}`);

    await updateDoc(ref, {
      pendingAmount: 0,
      paidAmount: item.total,
      paymentCompleted: true,
      paymentCompletedAt: new Date()
    });

    this.loadPendingPayments();
  }

}
