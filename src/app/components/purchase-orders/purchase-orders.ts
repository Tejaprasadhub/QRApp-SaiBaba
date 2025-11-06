import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  getDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-purchase-orders',
  standalone: false,
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.scss',
})
export class PurchaseOrders {
// purchaseOrders$!: Observable<any[]>;
//   selectedOrder: any = null;
//   displayDialog = false;

//   constructor(private firestore: Firestore) {}

//   ngOnInit() {
//     const ref = collection(this.firestore, 'purchaseOrders');
//     this.purchaseOrders$ = collectionData(ref, { idField: 'id' });
//   }

//   viewOrder(order: any) {
//     this.selectedOrder = order;
//     this.displayDialog = true;
//   }

//   async markAsReceived(order: any) {
//     const ref = doc(this.firestore, `purchaseOrders/${order.id}`);
//     await updateDoc(ref, { status: 'received', receivedAt: new Date() });
//     alert('Order marked as received!');
//     this.displayDialog = false;
//   }

//   async deleteOrder(order: any) {
//     if (confirm('Delete this order?')) {
//       const ref = doc(this.firestore, `purchaseOrders/${order.id}`);
//       await deleteDoc(ref);
//       alert('Order deleted.');
//       this.displayDialog = false;
//     }
//   }

purchaseOrders$!: Observable<any[]>;
  selectedOrder: any = null;
  displayDialog = false;
  editingItem: any = null;

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    const ref = collection(this.firestore, 'purchaseOrders');
    this.purchaseOrders$ = collectionData(ref, { idField: 'id' });
  }

  viewOrder(order: any) {
    this.selectedOrder = { ...order };
    this.displayDialog = true;
  }

  startEdit(item: any) {
    this.editingItem = { ...item, receivedQty: item.orderQty, newPrice: item.price };
  }

  async saveItemReceipt(order: any, item: any) {
    if (!this.editingItem?.receivedQty) return alert('Enter quantity');

    const orderRef = doc(this.firestore, `purchaseOrders/${order.id}`);
    const productRef = doc(this.firestore, `products/${item.productId}`);

    // 1️⃣ Update product stock and optionally price
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const prod = productSnap.data() as any;
      const newStock = (prod.stock || 0) + Number(this.editingItem.receivedQty);
      const newPrice = this.editingItem.newPrice || prod.price;
      await updateDoc(productRef, { stock: newStock, price: newPrice });
    }

    // 2️⃣ Mark this line as received in the order
    const updatedItems = order.items.map((p: any) =>
      p.productId === item.productId
        ? { ...p, received: true, receivedQty: this.editingItem.receivedQty, newPrice: this.editingItem.newPrice }
        : p
    );
    await updateDoc(orderRef, { items: updatedItems });

    alert(`${item.name} received and stock updated`);
    this.editingItem = null;
  }
}
