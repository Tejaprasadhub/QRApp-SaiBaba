import { Component } from '@angular/core';
import { CategoryService } from '../../services/category';
import { SubcategoryService } from '../../services/sub-category';
import { ProductService } from '../../services/product';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';

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
  loading = false;

  constructor(
    private cs: CategoryService,
    private ss: SubcategoryService,
    private ps: ProductService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.cs.getCategories().subscribe(c => this.categories = c);
  }

  loadSubcats() {
    if (!this.product.categoryId) { 
      this.subcategories = []; 
      return; 
    }
    this.ss.getByCategory(this.product.categoryId).subscribe(s => this.subcategories = s);
  }

  async add() {
    if (!this.product.name.trim()) return alert('Product name is required');
    if (!this.product.categoryId) return alert('Please select a category');

    this.loading = true;

    const cat = this.categories.find(c => c.id === this.product.categoryId);
    const sub = this.subcategories.find(s => s.id === this.product.subcategoryId);

    try {
      // 🔍 Duplicate check: Query Firestore for same category + name (case-insensitive)
      const productsRef = collection(this.firestore, 'products');
      const q = query(
        productsRef,
        where('categoryId', '==', this.product.categoryId),
        where('name', '==', this.product.name.trim().toUpperCase())
      );

      const existingSnap = await getDocs(q);

      if (!existingSnap.empty) {
        this.loading = false;
        alert(`Product "${this.product.name}" already exists in category "${cat.name}".`);
        return;
      }

      // ✅ Proceed with adding
      const payload = {
        name: this.product.name.trim().toUpperCase(),
        price: Number(this.product.price),
        stock: Number(this.product.stock),
        minStock: Number(this.product.minStock || 5),
        categoryId: cat.id,
        categoryName: cat.name,
        subcategoryId: sub?.id || '',
        subcategoryName: sub?.name || '',
        salesCount: 0,
        lastSoldAt: null,        // <-- add this
        createdAt: new Date()
      };

      await this.ps.addProduct(payload);
      alert('✅ Product added successfully!');
      this.product = { name: '', price: 0, stock: 0, categoryId: '', subcategoryId: '', minStock: 5 };
    } catch (err) {
      console.error(err);
      alert('Error adding product. Please try again.');
    } finally {
      this.loading = false;
    }
  }
}
