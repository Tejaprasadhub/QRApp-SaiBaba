import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { PurchaseOrderService } from '../../services/purchase-order';
import { Firestore, collection, collectionData, addDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
// Define a Product interface for strong typing
interface Product {
  id: number;
  name: string;
  stock?: number;
  minStock?: number;
  categoryName?: string;
  subcategoryName?: string;
}

@Component({
  selector: 'app-reorder',
  standalone: false,
  templateUrl: './reorder.html',
  styleUrls: ['./reorder.scss'],
})
export class Reorder implements OnInit {
//   grouped: Record<string, Product[]> = {};

//   constructor(
//     private ps: ProductService,
//     private po: PurchaseOrderService
//   ) {}

//   ngOnInit(): void {
//     this.ps.getProducts().subscribe((products: Product[]) => {
//       // Filter low stock products
//       const lowStock = products.filter(
//         (p) => (p.stock ?? 0) <= (p.minStock ?? 5)
//       );

//       // Group by category → subcategory
//       this.grouped = lowStock.reduce((acc: Record<string, Product[]>, item) => {
//         const key = `${item.categoryName || 'Uncategorized'}||${item.subcategoryName || 'Unbranded'}`;

//         if (!acc[key]) {
//           acc[key] = [];
//         }

//         acc[key].push(item);
//         return acc;
//       }, {});
//     });
//   }

//   getKeyPart(key: unknown, index: number): string {
//   const str = String(key ?? '');
//   return str.split('||')[index] || '';
// }

//   async createOrder(groupKey: any): Promise<void> {
//     const [categoryName, subcategoryName] = groupKey.split('||');

//     const items = (this.grouped[groupKey] || []).map((p) => ({
//       productId: p.id,
//       name: p.name,
//       currentStock: p.stock ?? 0,
//       orderQty: Math.max((p.minStock ?? 5) - (p.stock ?? 0), 1),
//     }));

//     const order = {
//       date: new Date(),
//       categoryName,
//       subcategoryName,
//       items,
//       status: 'pending',
//     };

//     await this.po.createOrder(order);
//     alert(`Purchase order created for ${categoryName} / ${subcategoryName}`);
//   }

products$!: Observable<any[]>;
  grouped: { [key: string]: any[] } = {};
  loading = true;

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    const productsRef = collection(this.firestore, 'products');
    this.products$ = collectionData(productsRef, { idField: 'id' });

    this.products$.subscribe((products) => {
      this.loading = false;
      const lowStock = products.filter(p => (p.stock || 0) <= (p.minStock || 0));

      // Group low-stock products by category
      this.grouped = lowStock.reduce((acc: any, p: any) => {
        if (!acc[p.categoryName]) acc[p.categoryName] = [];
        acc[p.categoryName].push(p);
        return acc;
      }, {});
    });
  }

  async createOrder(categoryName: string, products: any[]) {
    if (!products.length) return;

    const orderItems = products.map(p => ({
      productId: p.id,
      name: p.name,
      orderQty: (p.minStock || 5) - (p.stock || 0),
      price: p.price,
      received: false // new field for line-level tracking
    }));

    const order = {
      categoryName,
      date: new Date(),
      status: 'pending',
      items: orderItems
    };

    const poRef = collection(this.firestore, 'purchaseOrders');
    await addDoc(poRef, order);
    alert(`Purchase order created for category "${categoryName}"`);
  }
}
