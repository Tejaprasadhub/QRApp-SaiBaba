import { Component } from '@angular/core';
import { CategoryService } from '../../services/category';
import { SubcategoryService } from '../../services/sub-category';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-product-form',
  standalone: false,
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm {
categories: any[] = [];
  subcategories: any[] = [];
  product: any = { name: '', price: 0, stock: 0, categoryId: '', subcategoryId: '', minStock: 5 };

  constructor(private cs: CategoryService, private ss: SubcategoryService, private ps: ProductService) { }

  ngOnInit() {
    this.cs.getCategories().subscribe(c => this.categories = c);
  }

  loadSubcats() {
    if (!this.product.categoryId) { this.subcategories = []; return; }
    this.ss.getByCategory(this.product.categoryId).subscribe(s => this.subcategories = s);
  }

  async add() {
    if (!this.product.name.trim()) return alert('Name required');
    const cat = this.categories.find(c => c.id === this.product.categoryId);
    const sub = this.subcategories.find(s => s.id === this.product.subcategoryId);
    const payload = {
      name: this.product.name,
      price: Number(this.product.price),
      stock: Number(this.product.stock),
      minStock: Number(this.product.minStock || 5),
      categoryId: cat.id,
      categoryName: cat.name,
      subcategoryId: sub?.id || '',
      subcategoryName: sub?.name || '',
      salesCount: 0,
      createdAt: new Date()
    };
    await this.ps.addProduct(payload);
    alert('Product added');
    this.product = { name: '', price: 0, stock: 0, categoryId: '', subcategoryId: '', minStock: 5 };
  }
}
