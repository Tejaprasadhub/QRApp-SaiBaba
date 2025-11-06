import { Component } from '@angular/core';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
products: any[] = [];

  constructor(private ps: ProductService) {}

  ngOnInit() {
    this.ps.getProducts().subscribe(p => this.products = p);
  }

  delete(id: string) {
    if (!confirm('Delete product?')) return;
    this.ps.deleteProduct(id);
  }
}
