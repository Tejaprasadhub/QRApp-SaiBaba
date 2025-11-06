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
  product: any = { 
    name: '', 
    price: 0, 
    stock: 0, 
    categoryId: '', 
    subcategoryId: '', 
    minStock: 5 
  };
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
      this.product.subcategoryId = '';
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
      // 🔍 Duplicate check (case-insensitive)
      // If subcategory is selected, check within that subcategory.
      // Otherwise, check within category only.
      const productsRef = collection(this.firestore, 'products');

      const filters = [
        where('categoryId', '==', this.product.categoryId),
        where('name', '==', this.product.name.trim().toUpperCase()),
      ];

      if (this.product.subcategoryId) {
        filters.push(where('subcategoryId', '==', this.product.subcategoryId));
      }

      const q = query(productsRef, ...filters);
      const existingSnap = await getDocs(q);

      if (!existingSnap.empty) {
        this.loading = false;

        const msg = this.product.subcategoryId
          ? `Product "${this.product.name}" already exists in category "${cat.name}" and subcategory "${sub?.name}".`
          : `Product "${this.product.name}" already exists in category "${cat.name}".`;

        alert(msg);
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
        lastSoldAt: null,
        createdAt: new Date(),
      };

      await this.ps.addProduct(payload);
      alert('✅ Product added successfully!');

      // Reset form
      this.product = { name: '', price: 0, stock: 0, categoryId: '', subcategoryId: '', minStock: 5 };
      this.subcategories = [];
    } catch (err) {
      console.error(err);
      alert('Error adding product. Please try again.');
    } finally {
      this.loading = false;
    }
  }
}
