import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  increment
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
  subCategories: any[] = [];
  editingItemMap: { [key: string]: any } = {};

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    // ✅ Correct Firestore collection name
    this.purchaseOrders$ = collectionData(collection(this.firestore, 'purchaseOrders'), { idField: 'id' });

    // ✅ Corrected collection name (was subCategories)
    collectionData(collection(this.firestore, 'subcategories'), { idField: 'id' })
      .subscribe((subs: any[]) => {
        this.subCategories = subs || [];
        console.log('Loaded subcategories:', this.subCategories);
      });
  }

  // ✅ Return subcategories for a given categoryId
  getSubsForCategory(categoryId: string): any[] {
    if (!Array.isArray(this.subCategories) || !categoryId) return [];
    return this.subCategories.filter(
      s => s?.categoryId?.toString().trim() === categoryId?.toString().trim()
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

    const orderRef = doc(this.firestore, `purchaseOrders/${order.id}`);
    const productRef = doc(this.firestore, `products/${item.productId}`);
    const subRef = doc(this.firestore, `subcategories/${editData.subCategoryId}`);

    // ✅ Update Product
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const prod = productSnap.data() as any;
      const newStock = (prod.stock || 0) + Number(editData.receivedQty);
      const newPrice = editData.newPrice || prod.price;
      await updateDoc(productRef, {
        stock: newStock,
        price: newPrice,
        subcategoryId: editData.subCategoryId,
        subcategoryName: editData.subCategoryName,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
      });
    }

    // ✅ Increment subcategory count (optional)
    await updateDoc(subRef, { count: increment(Number(editData.receivedQty)) });

    // ✅ Update Purchase Order item
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

    await updateDoc(orderRef, { items: updatedItems });

    alert(`${item.name} received (${editData.receivedQty}) successfully under subcategory ${editData.subCategoryName}.`);
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
