import { Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData, addDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-reorder',
  standalone: false,
  templateUrl: './reorder.html',
  styleUrls: ['./reorder.scss'],
})
export class Reorder implements OnInit {
  products$!: Observable<any[]>;
  grouped: { [key: string]: any[] } = {};
  loading = true;

  purchaseOrders$!: Observable<any[]>;
  orders: any[] = [];
  createdOrders: { [category: string]: boolean } = {}; // track categories with orders

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    // Load products
    const productsRef = collection(this.firestore, 'products');
    this.products$ = collectionData(productsRef, { idField: 'id' });

    this.products$.subscribe((products) => {
      this.loading = false;
      const lowStock = products.filter(p => (p.stock || 0) <= (p.minStock || 0));

      // Group low-stock products by category
      this.grouped = lowStock.reduce((acc: any, p: any) => {
        if (!acc[p.categoryName]) acc[p.categoryName] = [];
        acc[p.categoryName].push({ ...p, orderQty: Math.max((p.minStock || 5) - (p.stock || 0), 1) });
        return acc;
      }, {});
    });

    // Load purchase orders
    const poRef = collection(this.firestore, 'purchaseOrders');
    this.purchaseOrders$ = collectionData(poRef, { idField: 'id' });

    this.purchaseOrders$.subscribe((orders) => {
      this.orders = orders;
      this.createdOrders = {};
      for (const o of orders) {
        if (o.status === 'pending') {
          this.createdOrders[o.categoryName] = true;
        }
      }
    });
  }

  async createOrder(categoryName: string, products: any[]) {
    if (!products.length) return;
    if (this.createdOrders[categoryName]) {
      alert(`Order for category "${categoryName}" has already been created.`);
      return;
    }

    const orderItems = products.map(p => ({
      productId: p.id,
      name: p.name,
      orderQty: p.orderQty,
      price: p.price,
      receivedQty: 0,
      received: false
    }));

    const order = {
      categoryName,
      date: new Date(),
      status: 'pending',
      items: orderItems
    };

    const poRef = collection(this.firestore, 'purchaseOrders');
    const docRef = await addDoc(poRef, order);
    alert(`Purchase order created for category "${categoryName}" with ID: ${docRef.id}`);

    this.createdOrders[categoryName] = true;
  }

  getOrderedQty(categoryName: string): number {
    const order = this.orders.find(o => o.categoryName === categoryName && o.status === 'pending');
    if (!order) return 0;
    return order.items.reduce((sum: number, item: any) => sum + (item.orderQty || 0), 0);
  }
}
