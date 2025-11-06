import { Component } from '@angular/core';
import { ProductService } from '../../services/product';
import { SalesService } from '../../services/sales';

@Component({
  selector: 'app-sales-form',
  standalone: false,
  templateUrl: './sales-form.html',
  styleUrl: './sales-form.scss',
})
export class SalesForm {
products: any[] = [];
  cart: any[] = [];
  total = 0;
  customer = '';

  constructor(private ps: ProductService, private ss: SalesService) {}

  ngOnInit() {
    this.ps.getProducts().subscribe(p => this.products = p);
  }

  addToCart(product: any) {
    if ((product.stock || 0) <= 0) return alert('Out of stock');
    const existing = this.cart.find(c => c.productId === product.id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({ productId: product.id, name: product.name, price: product.price, qty: 1 });
    }
    this.recalc();
  }

  recalc() {
    this.total = this.cart.reduce((s, i) => s + (i.price * i.qty), 0);
  }

  async checkout() {
    if (this.cart.length === 0) return alert('Cart empty');
    const sale = {
      date: new Date(),
      items: this.cart.map(c => ({ productId: c.productId, name: c.name, qty: c.qty, price: c.price })),
      total: this.total,
      customer: this.customer || 'Walk-in',
      paymentMode: 'cash'
    };
    await this.ss.addSale(sale);
    alert('Sale recorded');
    this.cart = []; this.total = 0; this.customer = '';
  }
}
