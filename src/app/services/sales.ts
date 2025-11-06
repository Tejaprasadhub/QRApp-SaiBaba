import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SalesService {
  constructor(private firestore: Firestore) {}

  async addSale(sale: any) {
    const ref = collection(this.firestore, 'sales');
    await addDoc(ref, sale);

    // update each product: reduce stock, increment salesCount, update lastSoldAt
    for (const item of sale.items) {
      const pRef = doc(this.firestore, `products/${item.productId}`);
      const snap = await getDoc(pRef);
      if (snap.exists()) {
        const p = snap.data() as any;
        const newStock = (p.stock || 0) - item.qty;
        const newSalesCount = (p.salesCount || 0) + item.qty;
        await updateDoc(pRef, {
          stock: newStock < 0 ? 0 : newStock,
          salesCount: newSalesCount,
          lastSoldAt: new Date()
        });
      }
    }
  }

  getSales(): Observable<any[]> {
    const ref = collection(this.firestore, 'sales');
    return collectionData(ref, { idField: 'id' });
  }
}
