import { Component } from '@angular/core';
import { Firestore, collection, query, where, updateDoc, doc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { combineLatest, take } from 'rxjs';
import { FirestoreLoaderService } from '../../services/firestore-loader.service';

@Component({
  selector: 'app-pending-payments',
  standalone: false,
  templateUrl: './pending-payments.html',
  styleUrls: ['./pending-payments.scss']
})
export class PendingPayments {

  activeTab: 'sales' | 'repairs' = 'sales';

  pendingSales: any[] = [];
  pendingRepairs: any[] = [];

  constructor(private firestore: Firestore,
     private fsLoader: FirestoreLoaderService
  ) {
    this.loadPendingPayments();
  }

  loadPendingPayments() {
    const salesRef = collection(this.firestore, 'sales');
    const repairsRef = collection(this.firestore, 'repairs');

    const salesQ = query(salesRef, where('pendingAmount', '>', 0));
    const repairsQ = query(repairsRef, where('pendingAmount', '>', 0));

    
  this.fsLoader
    .wrapObservable(
combineLatest([
      collectionData(salesQ, { idField: 'id' }),
      collectionData(repairsQ, { idField: 'id' })
    ]).pipe(take(1))).subscribe(([sales, repairs]: any[]) => {

      this.pendingSales = sales
        .map((s: any) => ({
          ...s,
          type: 'sale',
          total: s.total,
          paymentMode: s.paymentMode || '—',
          date: s.date
        }))
        .sort((a:any, b:any) => b.date.toDate() - a.date.toDate());

      this.pendingRepairs = repairs
        .map((r: any) => ({
          ...r,
          type: 'repair',
          total: r.estimatedAmount,
          paymentMode: 'Repair',
          date: r.inDate
        }))
        .sort((a:any, b:any) => b.date.toDate() - a.date.toDate());
    });
  }

  async markPartialPaid(item: any) {
  const amountStr = prompt('Enter partial payment amount:');

  if (!amountStr) return;

  const amount = Number(amountStr);
  if (isNaN(amount) || amount <= 0 || amount > item.pendingAmount) {
    alert('Invalid amount');
    return;
  }

  const collectionName = item.type === 'sale' ? 'sales' : 'repairs';
  const ref = doc(this.firestore, `${collectionName}/${item.id}`);

  await this.fsLoader.wrapPromise(
  updateDoc(ref, {
    paidAmount: (item.paidAmount || 0) + amount,
    pendingAmount: item.pendingAmount - amount
  })
);

this.loadPendingPayments();

}

async markFullyPaid(item: any) {
 const amountStr = prompt(
  `Enter payment amount (Pending ₹${item.pendingAmount}):`,
  item.pendingAmount
);


  if (!amountStr) return;

  const amount = Number(amountStr);
  if (isNaN(amount) || amount !== item.pendingAmount) {
    alert('Amount must match pending amount');
    return;
  }

  const collectionName = item.type === 'sale' ? 'sales' : 'repairs';
  const ref = doc(this.firestore, `${collectionName}/${item.id}`);

 const updateData: any = {
  paidAmount: (item.paidAmount || 0) + amount,
  pendingAmount: 0,
  completedAt: new Date()
};

if (item.type === 'repair') {
  updateData.status = 'completed';
}

if (item.type === 'sale') {
  updateData.paymentStatus = 'paid';
}
await this.fsLoader.wrapPromise(updateDoc(ref, updateData));

this.loadPendingPayments();
}

}
