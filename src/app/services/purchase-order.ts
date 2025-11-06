import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  constructor(private firestore: Firestore) {}

  createOrder(order: any) {
    const ref = collection(this.firestore, 'purchaseOrders');
    return addDoc(ref, order);
  }

  getOrders(): Observable<any[]> {
    const ref = collection(this.firestore, 'purchaseOrders');
    return collectionData(ref, { idField: 'id' });
  }
}
