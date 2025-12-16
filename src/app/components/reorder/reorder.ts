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
categories: any[] = [];
subcategories: any[] = [];
selectedCategory: any = null;     // category object
selectedSubcategory: any = null;  // subcategory object




  products$!: Observable<any[]>;
  grouped: { [key: string]: any[] } = {};
  loading = true;

  purchaseOrders$!: Observable<any[]>;
  orders: any[] = [];
  createdOrders: { [category: string]: boolean } = {};

  activeCategory: string | null = null;

  constructor(private firestore: Firestore) {}

  ngOnInit() {
  this.loadCategories();
  this.loadPurchaseOrders();
}
loadPurchaseOrders() {
  const poRef = collection(this.firestore, 'purchaseOrders');
  collectionData(poRef, { idField: 'id' }).subscribe((orders: any[]) => {
    this.orders = orders;
    this.updateCreatedOrders();
  });
}
updateCreatedOrders() {
  this.createdOrders = {};
  this.orders.forEach(order => {
    if (order.status === 'pending') {
      this.createdOrders[order.categoryName] = true;
    }
  });
}




  loadCategories() {
  const catRef = collection(this.firestore, 'categories');
  collectionData(catRef, { idField: 'id' }).subscribe((cats: any[]) => {
    this.categories = cats;
  });
}

loadSubcategories() {

  if (!this.selectedCategory) {
    this.subcategories = [];
    this.grouped = {}; 
    return;
  }

  const subRef = collection(this.firestore, 'subcategories');

  collectionData(subRef, { idField: 'id' }).subscribe((list: any[]) => {
this.subcategories = list.filter(s => s.categoryId === this.selectedCategory.id);
  });

  // After selecting category, load products (subcategory optional)
  this.loadProducts();
}


loadProducts() {
  this.loading = true;

  const productsRef = collection(this.firestore, 'products');
  collectionData(productsRef, { idField: 'id' }).subscribe((products) => {
    
    products = products.filter(p => p['categoryId'] === this.selectedCategory.id);

if (this.selectedSubcategory) {
  products = products.filter(p => p['subcategoryId'] === this.selectedSubcategory.id);
}


    this.processProducts(products);
    this.loading = false;
  });
}


processProducts(products: any[]) {
  const productMap: Record<string, any> = {};

  // 1. Aggregate by category + name
  for (const p of products) {
    const key = `${p.categoryId}_${(p.name || '').trim().toLowerCase()}`;

    if (!productMap[key]) {
      productMap[key] = {
        productIds: [p.id], 
        categoryId: p.categoryId,
        categoryName: p.categoryName,
        name: (p.name || '').trim(),
        stock: p.stock || 0,
        minStock: p.minStock || 0,
        price: p.price || 0, // choose base price if needed
      };
    } else {
      productMap[key].stock += p.stock || 0;
      productMap[key].minStock = Math.max(
        productMap[key].minStock,
        p.minStock || 0
      );
      productMap[key].productIds.push(p.id); // ✅ FIX
    }
  }

  // 2. Convert map → array
  const aggregatedProducts = Object.values(productMap);

  // 3. Filter low stock AFTER aggregation
  const lowStock = aggregatedProducts.filter(
    (p: any) => p.stock < p.minStock
  );

  // 4. Group by category
  const categoryGroups: Record<string, any[]> = {};

  for (const p of lowStock) {
    const catName = p.categoryName || 'Uncategorized';

    if (!categoryGroups[catName]) {
      categoryGroups[catName] = [];
    }

    categoryGroups[catName].push({
      ...p,
      orderQty: Math.max(p.minStock - p.stock, 1),
    });
  }

  // 5. Sort products inside category
  for (const key of Object.keys(categoryGroups)) {
    categoryGroups[key].sort(
      (a: any, b: any) => (a.price || 0) - (b.price || 0)
    );
  }

  this.grouped = categoryGroups;
}





  async createOrder(categoryName: string, products: any[]) {
    if (!products.length) return;
    if (this.createdOrders[categoryName]) {
      alert(`A pending order already exists for "${categoryName}".`);
      return;
    }

    const first = products[0];
    const categoryId = first.categoryId || null;

    const orderItems = products.map((p) => ({
      productId: p.id,
      name: p.name,
      orderQty: p.orderQty,
      price: p.price,
      receivedQty: 0,
      received: false,
      categoryId: p.categoryId || categoryId,
      categoryName: p.categoryName || categoryName,
      subCategoryId: p.subcategoryId || null,
      subCategoryName: p.subcategoryName || '—',
    }));

    const order = {
      categoryId,
      categoryName,
      date: new Date(),
      status: 'pending',
      items: orderItems,
    };

    const poRef = collection(this.firestore, 'purchaseOrders');
    const docRef = await addDoc(poRef, order);
    alert(`Purchase order created for "${categoryName}" (ID: ${docRef.id})`);
    this.createdOrders[categoryName] = true;
    this.loadPurchaseOrders(); // refresh list

  }

  getOrderedQty(categoryName: string): number {
    const order = this.orders.find(
      (o) => o.categoryName === categoryName && o.status === 'pending'
    );
    if (!order) return 0;
    return order.items.reduce((sum: number, item: any) => sum + (item.orderQty || 0), 0);
  }

  toggleCategory(category: string) {
    this.activeCategory =
      this.activeCategory === category ? null : category;
  }
}
