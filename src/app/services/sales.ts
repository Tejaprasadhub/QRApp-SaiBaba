// import { Injectable } from '@angular/core';
// import { Firestore, collection, addDoc, collectionData, doc, getDoc, updateDoc } from '@angular/fire/firestore';
// import { Observable } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class SalesService {
//   constructor(private firestore: Firestore) {}

//   async addSale(sale: any) {
//     const ref = collection(this.firestore, 'sales');
//     await addDoc(ref, sale);

//     // update each product: reduce stock, increment salesCount, update lastSoldAt
//     for (const item of sale.items) {
//       const pRef = doc(this.firestore, `products/${item.productId}`);
//       const snap = await getDoc(pRef);
//       if (snap.exists()) {
//         const p = snap.data() as any;
//         const newStock = (p.stock || 0) - item.qty;
//         const newSalesCount = (p.salesCount || 0) + item.qty;
//         await updateDoc(pRef, {
//           stock: newStock < 0 ? 0 : newStock,
//           salesCount: newSalesCount,
//           lastSoldAt: new Date()
//         });
//       }
//     }
//   }

//   getSales(): Observable<any[]> {
//     const ref = collection(this.firestore, 'sales');
//     return collectionData(ref, { idField: 'id' });
//   }
// }


// src/app/services/sales.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  runTransaction,
  collectionData,
  orderBy,
} from '@angular/fire/firestore';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SalesService {
  constructor(private firestore: Firestore) {}

  // --------------------------
  // Find customer by phone or create
  // --------------------------
  async getOrCreateCustomerByPhone(phone: string, name = ''): Promise<string | null> {
    if (!phone) return null;
    const coll = collection(this.firestore, 'customers');
    const q = query(coll, where('phone', '==', phone));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      // update lastVisit
      await updateDoc(d.ref, { lastVisitAt: new Date() }).catch(() => {});
      return d.id;
    }

    // create new customer
    const newDoc = await addDoc(coll, {
      name: name || 'Unknown',
      phone,
      createdAt: new Date(),
      lastVisitAt: new Date(),
      totalPurchases: 0,
      totalPendingAmount: 0,
    });
    return newDoc.id;
  }

  // --------------------------
  // Add sale (transactional)
  // sale expected shape:
  // {
  //   date?,
  //   customerName?, customerPhone?,
  //   items: [{ productId, name, qty, costPrice, sellingPrice, categoryName }],
  //   total,
  //   paymentMode: 'cash'|'upi'|'card'|'credit'
  // }


  // ============================
  // 🔥 CREATE/UPDATE CUSTOMER
  // ============================
  private async attachCustomerByPhone(phone: string) {
    if (!phone) return null;

    const ref = collection(this.firestore, 'customers');
    const q1 = query(ref, where('phone', '==', phone));
    const list = await firstValueFrom(collectionData(q1, { idField: 'id' }));

    if (list.length > 0) {
      return list[0]; // return existing
    }

    // create new customer
    const newCustomer = await addDoc(ref, {
      phone,
      name: 'Walk-in',
      createdAt: new Date(),
      totalPendingAmount: 0,
    });

    return { id: newCustomer.id, phone, name: 'Walk-in', totalPendingAmount: 0 };
  }
  // --------------------------
async addSale(sale: any): Promise<string> {
  if (!sale || !Array.isArray(sale.items) || sale.items.length === 0) {
    throw new Error("Cart empty");
  }

  // Normalize
  const saleDate = sale.date ? new Date(sale.date) : new Date();
  const customerPhone = sale.customerPhone?.toString().trim() || "";
  const customerName =
    sale.customerName?.toString().trim() || sale.customer || "Walk-in";

    const total = Number(sale.total || 0);
const paymentMode = sale.paymentMode || 'cash';

const paidAmount = paymentMode === 'cash' ? total : sale.paidAmount ? Number(sale.paidAmount || 0) : 0;

const pendingAmount = Math.max(0, total - paidAmount);

const paymentStatus =
  pendingAmount === 0 ? 'paid' : 'pending';


  let customerId: string | null = null;

  // 1️⃣ Resolve customer BEFORE transaction
  if (customerPhone) {
    const custColl = collection(this.firestore, "customers");
    const q = query(custColl, where("phone", "==", customerPhone));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // Customer exists
      customerId = snap.docs[0].id;

      // Update lastVisit WITHOUT needing a transaction
      await updateDoc(snap.docs[0].ref, { lastVisit: new Date() });
    } else {
      // Create new customer
      const newCustRef = await addDoc(custColl, {
        name: customerName,
        phone: customerPhone,
        createdAt: new Date(),
        lastVisitAt: new Date(),
        totalPurchases: 0,
        totalPendingAmount: 0,
      });
      customerId = newCustRef.id;
    }
  }

  // 2️⃣ Prepare sale payload
  const salePayload = {
    ...sale,
    date: saleDate,
    customerId: customerId || null,
    customerPhone: customerPhone || null,
    customerName: customerName,
    paymentStatus,
    pendingAmount,
  };

  // 3️⃣ Create sale BEFORE transaction
  const salesColl = collection(this.firestore, "sales");
  const saleDocRef = await addDoc(salesColl, salePayload);
  const newSaleId = saleDocRef.id;

  // 4️⃣ Transaction → update product stock + customer stats
 await runTransaction(this.firestore, async (tx) => {

  // =========================
  // 1️⃣ READ PHASE (ONLY READS)
  // =========================

  const productSnaps: any[] = [];

  for (const item of sale.items) {
    const pRef = doc(this.firestore, `products/${item.productId}`);
    const pSnap = await tx.get(pRef);
    if (!pSnap.exists()) continue;

    productSnaps.push({
      ref: pRef,
      data: pSnap.data(),
      qty: Number(item.qty || 0),
    });
  }

  let customerSnap: any = null;
  let customerRef: any = null;

  if (customerId) {
    customerRef = doc(this.firestore, `customers/${customerId}`);
    customerSnap = await tx.get(customerRef);
  }

  // =========================
  // 2️⃣ WRITE PHASE (ONLY WRITES)
  // =========================

  // update products
  for (const p of productSnaps) {
    const newStock = Number(p.data.stock || 0) - p.qty;

    tx.update(p.ref, {
      stock: Math.max(0, newStock),
      salesCount: (p.data.salesCount || 0) + p.qty,
      lastSoldAt: new Date(),
    });
  }

  // update customer stats
  if (customerSnap?.exists()) {
    const c: any = customerSnap.data();

    tx.update(customerRef, {
      totalPurchases: (c.totalPurchases || 0) + Number(sale.total || 0),
      totalPendingAmount: (c.totalPendingAmount || 0) + pendingAmount,
      lastVisitAt: new Date(),
    });
  }
});


  // 5️⃣ Create Payment record OUTSIDE the transaction
  const paymentsColl = collection(this.firestore, "payments");

  if (pendingAmount > 0) {
    // pending payment entry
    await addDoc(paymentsColl, {
      saleId: newSaleId,
      customerPhone: customerPhone || null,
      customerId: customerId || null,
      amount: sale.total,
      paidAmount: sale.paidAmount,
      pendingAmount: pendingAmount,
      status: "pending",
      createdAt: new Date(),
    });
  } else {
    // completed payment entry
    await addDoc(paymentsColl, {
      saleId: newSaleId,
      customerPhone: customerPhone || null,
      customerId: customerId || null,
      amount: sale.total,
      paidAmount: sale.paidAmount,
      pendingAmount: 0,
      status: "completed",
      createdAt: new Date(),
    });
  }

  return newSaleId;
}


  // --------------------------
  // Get all sales (stream)
  // --------------------------
  getSales(): Observable<any[]> {
    const coll = collection(this.firestore, 'sales');
    return collectionData(coll, { idField: 'id' });
  }

  // --------------------------
  // Get sales by customer phone
  // --------------------------
  getSalesByCustomerPhone(phone: string): Observable<any[]> {
    if (!phone) {
      const coll = collection(this.firestore, 'sales');
      return collectionData(coll, { idField: 'id' });
    }
    const coll = collection(this.firestore, 'sales');
    const q = query(coll, where('customerPhone', '==', phone), orderBy('date'));
    return collectionData(q, { idField: 'id' });
  }

  // --------------------------
  // Get customer by phone
  // --------------------------
  async getCustomerByPhone(phone: string): Promise<any | null> {
    if (!phone) return null;
    const coll = collection(this.firestore, 'customers');
    const q = query(coll, where('phone', '==', phone));
    const snap = await getDocs(q);
    if (!snap.empty) return { id: snap.docs[0].id, ...(snap.docs[0].data() as any) };
    return null;
  }

  // --------------------------
  // Pending payments stream
  // --------------------------
  getPendingPayments(): Observable<any[]> {
    const coll = collection(this.firestore, 'payments');
    const q = query(coll, where('status', '==', 'pending'), orderBy('createdAt'));
    return collectionData(q, { idField: 'id' });
  }

  // --------------------------
  // Repairs stream by status
  // --------------------------
  getRepairsByStatus(status: 'pending' | 'completed' | 'delivered'): Observable<any[]> {
    const coll = collection(this.firestore, 'repairs');
    const q = query(coll, where('status', '==', status), orderBy('createdAt'));
    return collectionData(q, { idField: 'id' });
  }

  // --------------------------
  // Add repair
  // --------------------------
  async addRepair(repair: any) {
    const coll = collection(this.firestore, 'repairs');
    const payload = {
      ...repair,
      createdAt: new Date(),
      status: 'pending',
    };
    return addDoc(coll, payload);
  }

  // --------------------------
  // Mark repair completed
  // --------------------------
  async completeRepair(repairId: string, collectedAmount = 0) {
    const rDoc = doc(this.firestore, `repairs/${repairId}`);
    await updateDoc(rDoc, {
      status: 'completed',
      completedAt: new Date(),
      amountCollected: collectedAmount,
    });
  }
}

