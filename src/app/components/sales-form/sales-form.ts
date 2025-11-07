import { Component } from '@angular/core';
import { ProductService } from '../../services/product';
import { SalesService } from '../../services/sales';

@Component({
  selector: 'app-sales-form',
  standalone: false,
  templateUrl: './sales-form.html',
  styleUrls: ['./sales-form.scss'],
})
export class SalesForm {
  products: any[] = [];
  cart: any[] = [];
  total = 0;
  customer = '';
  productSearch = '';
  selectedCategory = '';

  // Pagination
  currentPage = 1;
  pageSize = 20;

  constructor(private ps: ProductService, private ss: SalesService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.ps.getProducts().subscribe((p) => {
      this.products = p.map((pr) => ({ ...pr }));
    });
  }

  addToCart(product: any) {
    if ((product.stock || 0) <= 0) return alert('Out of stock');

    const existing = this.cart.find((c) => c.productId === product.id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        costPrice: product.price,
        sellingPrice: product.sellingPrice || product.price,
        qty: 1,
        categoryName: product.categoryName || 'Uncategorized',
      });
    }

    product.stock--;
    this.recalc();
  }

  removeFromCart(item: any) {
    const index = this.cart.findIndex((c) => c.productId === item.productId);
    if (index === -1) return;

    const product = this.products.find((p) => p.id === item.productId);
    if (product) product.stock += item.qty;

    this.cart.splice(index, 1);
    this.recalc();
  }

  recalc() {
    this.total = this.cart.reduce(
      (s, i) => s + this.safeNumber(i.sellingPrice) * this.safeNumber(i.qty),
      0
    );
  }

  private safeNumber(v: any): number {
    if (v == null) return 0;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  async checkout() {
    if (this.cart.length === 0) return alert('Cart empty');

    const sale = {
      date: new Date(),
      items: this.cart.map((c) => ({
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
    this.loadProducts();
  }

  canAddToCart(product: any): boolean {
    return (product.stock || 0) > 0;
  }

  isLowStock(product: any): boolean {
    return (product.stock || 0) > 0 && (product.stock || 0) <= (product.minStock || 5);
  }

  getCategories(): string[] {
    const cats = this.products.map((p) => p.categoryName).filter((c) => !!c);
    return Array.from(new Set(cats));
  }

  filteredProducts(): any[] {
    const filtered = this.products.filter((p) => {
      const matchesCategory = this.selectedCategory ? p.categoryName === this.selectedCategory : true;
      const matchesSearch = p.name.toLowerCase().includes(this.productSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
    // Pagination
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    const filteredLength = this.products.filter((p) => {
      const matchesCategory = this.selectedCategory ? p.categoryName === this.selectedCategory : true;
      const matchesSearch = p.name.toLowerCase().includes(this.productSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    }).length;
    return Math.ceil(filteredLength / this.pageSize);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage = page;
  }
}
