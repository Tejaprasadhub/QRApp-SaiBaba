// src/app/services/payments.service.ts
import { Injectable } from '@angular/core';
import { Firestore, doc, updateDoc, collection, addDoc, runTransaction, getDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  constructor(private firestore: Firestore) {}

  /**
   * Record a payment against a sale.
   * This supports:
   *  - partial payments
   *  - full payments
   *  - auto-updates sales.paymentStatus
   *  - auto-updates payments.pendingAmount
   *  - auto-updates customers.totalPendingAmount
   */
  async paySale(
    saleId: string,
    customerId: string | undefined,
    amount: number,
    method: 'cash' | 'upi' | 'card' | string = 'cash'
  ) {
    if (!saleId) throw new Error('Sale ID is required');
    if (!amount || amount <= 0) throw new Error('Amount must be greater than zero');

    const saleRef = doc(this.firestore, `sales/${saleId}`);

    // If sale has no customerId (walk-in) pass customerId as undefined.
    const customerRef = customerId
      ? doc(this.firestore, `customers/${customerId}`)
      : null;

    const paymentsCol = collection(this.firestore, `payments`);

    await runTransaction(this.firestore, async (tx) => {
      // ----------------------------------------
      // 1) LOAD SALE DOCUMENT
      // ----------------------------------------
      const saleSnap = await tx.get(saleRef);
      if (!saleSnap.exists()) throw new Error('Sale not found');
      const sale: any = saleSnap.data();

      const oldPending = Number(sale.pendingAmount || 0);
      const newPending = oldPending - amount;

      // Status logic
      let newStatus = sale.paymentStatus || 'paid';

      if (oldPending > 0) {
        if (newPending > 0) newStatus = 'partial';
        else newStatus = 'paid';
      }

      // ----------------------------------------
      // 2) UPDATE SALE DOCUMENT
      // ----------------------------------------
      tx.update(saleRef, {
        pendingAmount: newPending < 0 ? 0 : newPending,
        paymentStatus: newStatus,
        updatedAt: new Date(),
      });

      // ----------------------------------------
      // 3) WRITE PAYMENT DOCUMENT
      // ----------------------------------------
      await addDoc(paymentsCol, {
        saleId,
        customerId: customerId || null,
        amount,
        method,
        status: 'completed',
        createdAt: new Date(),
      });

      // ----------------------------------------
      // 4) UPDATE CUSTOMER (if exists)
      // ----------------------------------------
      if (customerRef) {
        const custSnap = await tx.get(customerRef);
        if (custSnap.exists()) {
          const c: any = custSnap.data();
          const custPending = Number(c.totalPendingAmount || 0);

          tx.update(customerRef, {
            totalPendingAmount: Math.max(0, custPending - amount),
            updatedAt: new Date(),
          });
        }
      }
    });
  }
}
