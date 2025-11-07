import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  getDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-purchase-orders',
  standalone:false,
  templateUrl: './purchase-orders.html',
  styleUrls: ['./purchase-orders.scss'],
})
export class PurchaseOrders implements OnInit {
  purchaseOrders$!: Observable<any[]>;
  editingItemMap: { [key: string]: { receivedQty: number; newPrice: number } } = {};

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    const ref = collection(this.firestore, 'purchaseOrders');
    this.purchaseOrders$ = collectionData(ref, { idField: 'id' });
  }

  getEditingItem(orderId: string, item: any) {
    const key = `${orderId}_${item.productId}`;
    if (!this.editingItemMap[key]) {
      this.editingItemMap[key] = {
        receivedQty: item.receivedQty || 0,
        newPrice: item.receivedPrice || item.price || 0,
      };
    }
    return this.editingItemMap[key];
  }

  async saveItem(order: any, item: any) {
    const editData = this.getEditingItem(order.id, item);
    if (!editData.receivedQty || editData.receivedQty <= 0) {
      return alert('Enter received quantity');
    }

    const orderRef = doc(this.firestore, `purchaseOrders/${order.id}`);
    const productRef = doc(this.firestore, `products/${item.productId}`);

    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const prod = productSnap.data() as any;
      const newStock = (prod.stock || 0) + Number(editData.receivedQty);
      const newPrice = editData.newPrice || prod.price;
      await updateDoc(productRef, { stock: newStock, price: newPrice });
    }

    const updatedItems = order.items.map((p: any) =>
      p.productId === item.productId
        ? {
            ...p,
            received: true,
            receivedQty: editData.receivedQty,
            receivedPrice: editData.newPrice || p.price,
          }
        : p
    );

    await updateDoc(orderRef, { items: updatedItems });
    alert(`${item.name} updated successfully with received quantity ${editData.receivedQty}`);

    this.editingItemMap[order.id + '_' + item.productId] = {
      receivedQty: editData.receivedQty,
      newPrice: editData.newPrice || item.price,
    };
  }

  async deleteOrder(orderId: string) {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    const orderRef = doc(this.firestore, `purchaseOrders/${orderId}`);
    await deleteDoc(orderRef);
    alert('Purchase order deleted');
  }

  totalReceived(order: any) {
    return order.items.reduce((sum: number, i: any) => sum + (i.receivedQty || 0), 0);
  }

  totalReceivedPrice(order: any) {
    return order.items.reduce(
      (sum: number, i: any) => sum + ((i.receivedPrice || i.price || 0) * (i.receivedQty || 0)),
      0
    );
  }
}
