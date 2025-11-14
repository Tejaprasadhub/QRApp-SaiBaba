import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  addDoc,
  increment,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-purchase-orders',
  standalone: false,
  templateUrl: './purchase-orders.html',
  styleUrls: ['./purchase-orders.scss'],
})
export class PurchaseOrders implements OnInit {
  purchaseOrders$!: Observable<any[]>;
  subcategories: any[] = [];
  editingItemMap: { [key: string]: any } = {};

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.purchaseOrders$ = collectionData(
      collection(this.firestore, 'purchaseOrders'),
      { idField: 'id' }
    );

    collectionData(collection(this.firestore, 'subcategories'), {
      idField: 'id',
    }).subscribe((subs: any[]) => {
      this.subcategories = subs || [];
    });
  }

  getSubsForCategory(categoryId: string): any[] {
    if (!categoryId || !Array.isArray(this.subcategories)) return [];
    return this.subcategories.filter(
      (s) =>
        (typeof s.categoryId === 'string' ? s.categoryId : s.categoryId.id).trim() ===
        categoryId.trim()
    );
  }

  getEditingItem(orderId: string, item: any) {
    const key = `${orderId}_${item.productId}`;
    if (!this.editingItemMap[key]) {
      this.editingItemMap[key] = {
        receivedQty: item.receivedQty || 0,
        newPrice: item.receivedPrice || item.price || 0,
        subCategoryId: item.subCategoryId || '',
        subCategoryName: item.subCategoryName || '',
      };
    }
    return this.editingItemMap[key];
  }

  async onSubCategoryChange(orderId: string, item: any) {
    const editData = this.getEditingItem(orderId, item);
    if (!editData.subCategoryId) return;

    const subRef = doc(this.firestore, `subcategories/${editData.subCategoryId}`);
    const subSnap = await getDoc(subRef);

    if (subSnap.exists()) {
      const subData = subSnap.data() as any;
      editData.subCategoryName = subData.name;
    }
  }

  async saveItem(order: any, item: any) {
    if (order.status === 'completed') {
      return alert('Cannot edit completed order.');
    }

    const editData = this.getEditingItem(order.id, item);
    const subList = this.getSubsForCategory(item.categoryId);

    if (!editData.receivedQty || editData.receivedQty <= 0) {
      return alert('Enter received quantity');
    }

    if (subList.length > 0 && !editData.subCategoryId) {
      return alert('Please select a subcategory');
    }

    let subRef: any = null;
    if (editData.subCategoryId) {
      subRef = doc(this.firestore, `subcategories/${editData.subCategoryId}`);
    }

    const productsCollection = collection(this.firestore, 'products');
    let q;

    if (editData.subCategoryId) {
      q = query(
        productsCollection,
        where('name', '==', item.name),
        where('subcategoryId', '==', editData.subCategoryId)
      );
    } else {
      q = query(productsCollection, where('name', '==', item.name));
    }

    const existingProductsSnap = await getDocs(q);

    if (!existingProductsSnap.empty) {
      const prodDoc = existingProductsSnap.docs[0];
      const prodData = prodDoc.data() as any;

      await updateDoc(prodDoc.ref, {
        stock: (prodData.stock || 0) + Number(editData.receivedQty),
        price: editData.newPrice || prodData.price,
      });
    } else {
      await addDoc(productsCollection, {
        name: item.name,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        subcategoryId: editData.subCategoryId || null,
        subcategoryName: editData.subCategoryName || '',
        stock: Number(editData.receivedQty),
        price: editData.newPrice || item.price,
        minStock: 5,
      });
    }

    if (subRef) {
      await updateDoc(subRef, { count: increment(Number(editData.receivedQty)) });
    }

    const updatedItems = order.items.map((p: any) =>
      p.productId === item.productId
        ? {
            ...p,
            received: true,
            receivedQty: editData.receivedQty,
            receivedPrice: editData.newPrice || p.price,
            subCategoryId: editData.subCategoryId,
            subCategoryName: editData.subCategoryName,
          }
        : p
    );

    const orderRef = doc(this.firestore, `purchaseOrders/${order.id}`);
    await updateDoc(orderRef, { items: updatedItems });

    // 🚀 CHECK IF ORDER COMPLETED
    const allReceived = updatedItems.every((it: any) => it.received === true);

    if (allReceived) {
      await updateDoc(orderRef, { status: 'completed' });
      alert('Order completed successfully.');
    } else {
      alert(`${item.name} received (${editData.receivedQty}) successfully.`);
    }
  }

  getLowestPriceSubName(item: any): string | null {
    return item.subCategoryName || null;
  }

  async deleteOrder(orderId: string) {
    const orderRef = doc(this.firestore, `purchaseOrders/${orderId}`);
    const docSnap = await getDoc(orderRef);

    if (docSnap.exists() && docSnap.data()['status'] === 'completed') {
      return alert('Cannot delete completed order.');
    }

    if (!confirm('Are you sure you want to delete this purchase order?')) return;

    await deleteDoc(orderRef);
    alert('Purchase order deleted');
  }

  totalReceived(order: any) {
    return order.items.reduce((sum: number, i: any) => sum + (i.receivedQty || 0), 0);
  }

  totalReceivedPrice(order: any) {
    return order.items.reduce(
      (sum: number, i: any) =>
        sum + ((i.receivedPrice || i.price || 0) * (i.receivedQty || 0)),
      0
    );
  }
}
