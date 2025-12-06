import { Component } from '@angular/core';
import { SalesService } from '../../services/sales';
import { Subject, debounceTime } from 'rxjs';
import { QueryDocumentSnapshot, DocumentData, Firestore, collection, query, where } from '@angular/fire/firestore';
import { Product, SalesProductService } from '../../services/sales-product-service';
import { collectionData } from '@angular/fire/firestore';

@Component({
  selector: 'app-sales-form',
  standalone: false,
  templateUrl: './sales-form.html',
  styleUrls: ['./sales-form.scss'],
})
export class SalesForm {
  products: Product[] = [];
  cart: any[] = [];
  total = 0;

  // 🟢 NEW — customer phone based
  customerPhone = '';
  customerData: any = null;

  productSearch = '';
  selectedCategory = '';

  pageSize = 10;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

  private searchSubject = new Subject<void>();

  paidAmount = 0;
paymentMode: 'cash' | 'credit' | 'partial' = 'cash';

  constructor(
    private ps: SalesProductService,
    private ss: SalesService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.loadProducts();

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.lastDoc = null;
      this.loadProducts();
    });
  }
ngDoCheck() {
  if (this.paidAmount > this.total) {
    this.paidAmount = this.total;
  }
}
  onSearchChange() {
    this.searchSubject.next();
  }

  // =====================
  // 🔥 Load products
  // =====================
  loadProducts() {
    this.ps.getProducts({
      name: this.productSearch.toUpperCase(),
      category: this.selectedCategory,
      pageSize: this.pageSize,
      lastDoc: this.lastDoc,
    }).subscribe(res => {
      this.products = res.data;
      this.lastDoc = res.lastDoc || null;
    });
  }

  loadNextPage() {
    if (!this.lastDoc) return;
    this.ps.getProducts({
      name: this.productSearch.toUpperCase(),
      category: this.selectedCategory,
      pageSize: this.pageSize,
      lastDoc: this.lastDoc,
    }).subscribe(res => {
      this.products = [...this.products, ...res.data];
      this.lastDoc = res.lastDoc || null;
    });
  }

  // =====================
  // 🔥 Load customer by phone
  // =====================
  loadCustomerByPhone() {
    if (!this.customerPhone) {
      this.customerData = {
        name: '',
        totalPendingAmount: 0
      };
      return;
    }

    const ref = collection(this.firestore, 'customers');
    const q1 = query(ref, where('phone', '==', this.customerPhone));

    collectionData(q1, { idField: 'id' }).subscribe(res => {
      this.customerData = res[0] || {
        name: '',
        totalPendingAmount: 0
      };;
    });
    
  }

  // =====================
  // 🔥 Cart Logic
  // =====================
  addToCart(product: Product) {
    if ((product.stock || 0) <= 0) return alert('Out of stock');

    const existing = this.cart.find(c => c.productId === product.id);
    if (existing) existing.qty++;
    else this.cart.push({
      productId: product.id,
      name: product.name,
      costPrice: product.price,
      sellingPrice: product.sellingPrice || product.price,
      qty: 1,
      categoryName: product.categoryName || 'Uncategorized',
      subcategoryName: product.subcategoryName || 'Uncategorized',
    });

    product.stock!--;
    this.recalc();
  }

  removeFromCart(item: any) {
    const index = this.cart.findIndex(c => c.productId === item.productId);
    if (index === -1) return;

    const product = this.products.find(p => p.id === item.productId);
    if (product) product.stock! += item.qty;

    this.cart.splice(index, 1);
    this.recalc();
  }

  recalc() {
    this.total = this.cart.reduce((s, i) =>
      s + Number(i.sellingPrice || 0) * Number(i.qty || 0)
    , 0);
  }

  // =====================
  // 🔥 Checkout
  // =====================
 async checkout() {
  if(!this.customerPhone.match(/^[6-9][0-9]{9}$/)) {
    alert('Enter a valid 10-digit phone number');
    return;
  }
  // guard clauses
  if (!this.cart.length) {
    alert('Cart empty');
    return;
  }

  if (!this.customerPhone) {
    alert('Enter customer phone');
    return;
  }
  if(!this.customerData || !this.customerData.name) {
    alert('Enter customer name');
    return;
  }
  if (this.paymentMode === 'partial' && (this.paidAmount <= 0 || this.paidAmount > this.total)) {
    alert('Enter valid paid amount for partial payment');
    return;
  }
  

  // prevent double click
  if ((this as any)._saving) return;
  (this as any)._saving = true;

  const sale = {
    date: new Date(),
    items: this.cart.map(c => ({
      productId: c.productId,
      name: c.name,
      qty: c.qty,
      costPrice: c.costPrice,
      sellingPrice: c.sellingPrice,
      categoryName: c.categoryName,
    })),
    customerPhone: this.customerPhone,
    total: this.total,
  paymentMode: this.paymentMode,
  paidAmount:
    this.paymentMode === 'partial'
      ? this.paidAmount
      : this.paymentMode === 'cash'
      ? this.total
      : 0,
      customerName: this.customerData?.name || 'Walk-in Customer'
  };

  try {
    const saleId = await this.ss.addSale(sale);

    console.log('✅ Sale saved:', saleId);

    alert('✅ Sale recorded successfully!');

    // reset UI
    this.cart = [];
    this.total = 0;
    this.customerPhone = '';
    this.customerData = null;
    this.lastDoc = null;

    this.loadProducts();

  } catch (err: any) {
    console.error('❌ Sale failed', err);

    alert(
      err?.message
        ? `❌ Sale failed: ${err.message}`
        : '❌ Sale failed. Check console.'
    );
  } finally {
    (this as any)._saving = false;
  }
}


  canAddToCart(product: Product): boolean {
    return (product.stock || 0) > 0;
  }

  isLowStock(product: Product): boolean {
    return (product.stock || 0) > 0 && (product.stock || 0) <= (product.minStock || 5);
  }

  getCategories(): string[] {
    const cats = this.products
      .map(p => p.categoryName)
      .filter((c): c is string => !!c);

    return Array.from(new Set(cats));
  }
}
