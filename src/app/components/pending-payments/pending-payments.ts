import { Component } from '@angular/core';
import { Firestore, collection, query, where, updateDoc, doc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';

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
  loadPendingPayments() {
    const ref = collection(this.firestore, 'sales');
    const q1 = query(ref, where('pendingAmount', '>', 0));

    collectionData(q1, { idField: 'id' }).subscribe(res => {
      this.pendingList = res.sort(
        (a, b) => b['date'].toDate() - a['date'].toDate()
      );
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
