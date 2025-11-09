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
    this.purchaseOrders$ = collectionData(collection(this.firestore, 'purchaseOrders'), { idField: 'id' });

    collectionData(collection(this.firestore, 'subcategories'), { idField: 'id' })
      .subscribe((subs: any[]) => {
        this.subcategories = subs || [];
      });
  }

  /** Return only subcategories for a given category */
  getSubsForCategory(categoryId: string): any[] {
    if (!categoryId || !Array.isArray(this.subcategories)) return [];
    return this.subcategories.filter(
      (s) => (typeof s.categoryId === 'string' ? s.categoryId : s.categoryId.id).trim() === categoryId.trim()
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
    const editData = this.getEditingItem(order.id, item);
    if (!editData.receivedQty || editData.receivedQty <= 0) {
      return alert('Enter received quantity');
    }
    if (!editData.subCategoryId) {
      return alert('Please select a subcategory');
    }

    const subRef = doc(this.firestore, `subcategories/${editData.subCategoryId}`);

    // Check if product with same name + subcategory exists
    const productsCollection = collection(this.firestore, 'products');
    const q = query(
      productsCollection,
      where('name', '==', item.name),
      where('subcategoryId', '==', editData.subCategoryId)
    );
    const existingProductsSnap = await getDocs(q);

    if (!existingProductsSnap.empty) {
      // Existing product → update stock and price
      const prodDoc = existingProductsSnap.docs[0];
      const prodData = prodDoc.data() as any;
      const newStock = (prodData.stock || 0) + Number(editData.receivedQty);
      const newPrice = editData.newPrice || prodData.price;

      await updateDoc(prodDoc.ref, {
        stock: newStock,
        price: newPrice,
      });
    } else {
      // New product → create with minStock: 5
      await addDoc(productsCollection, {
        name: item.name,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        subcategoryId: editData.subCategoryId,
        subcategoryName: editData.subCategoryName,
        stock: Number(editData.receivedQty),
        price: editData.newPrice || item.price,
        minStock: 5,
      });
    }

    // Update subcategory count
    await updateDoc(subRef, { count: increment(Number(editData.receivedQty)) });

    // Update purchase order item as received
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

    alert(
      `${item.name} received (${editData.receivedQty}) successfully under subcategory ${editData.subCategoryName}.`
    );
  }

  getLowestPriceSubName(item: any): string | null {
    return item.subCategoryName || null;
  }

  async deleteOrder(orderId: string) {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    await deleteDoc(doc(this.firestore, `purchaseOrders/${orderId}`));
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
