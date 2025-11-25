import { Component } from '@angular/core';
import { SalesService } from '../../services/sales';
import { Subject, debounceTime } from 'rxjs';
import { QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';
import { Product, SalesProductService } from '../../services/sales-product-service';

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
  customer = '';
  productSearch = '';
  selectedCategory = '';

  pageSize = 10;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

  private searchSubject = new Subject<void>();

  constructor(private ps: SalesProductService, private ss: SalesService) {}

  ngOnInit() {
    this.loadProducts();

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.lastDoc = null; // Reset pagination when search changes
      this.loadProducts();
    });
  }

  onSearchChange() {
    this.searchSubject.next();
  }

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
    this.total = this.cart.reduce((s, i) => s + this.safeNumber(i.sellingPrice) * this.safeNumber(i.qty), 0);
  }

  private safeNumber(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  async checkout() {
    if (!this.cart.length) return alert('Cart empty');

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
      total: this.total,
      customer: this.customer || 'Walk-in',
      paymentMode: 'cash',
    };

    await this.ss.addSale(sale);
    alert('✅ Sale recorded successfully!');

    this.cart = [];
    this.total = 0;
    this.customer = '';
    this.lastDoc = null;
    this.loadProducts();
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
    .filter((c): c is string => !!c); // Type guard ensures c is string
  return Array.from(new Set(cats));
}
}
