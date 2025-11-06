import { Component } from '@angular/core';
import { ProductService } from '../../services/product';
import { CategoryService } from '../../services/category';
import { SubcategoryService } from '../../services/sub-category';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList {
  products: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];
  editingProduct: any = null;
  loading = false;

  constructor(
    private ps: ProductService,
    private cs: CategoryService,
    private ss: SubcategoryService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.ps.getProducts().subscribe(p => (this.products = p));
    this.cs.getCategories().subscribe(c => (this.categories = c));
    this.ss.getSubcategories().subscribe(s => (this.subcategories = s));
  }

  delete(id: string) {
    if (!confirm('Delete product?')) return;
    this.ps.deleteProduct(id);
  }

  // ✏️ Start edit mode
  startEdit(product: any) {
    this.editingProduct = { ...product };
  }

  // 🧭 Get filtered subcategories for current category
  filteredSubcategories() {
    if (!this.editingProduct?.categoryId) return [];
    return this.subcategories.filter(
      s => s.categoryId === this.editingProduct.categoryId
    );
  }

  // 💾 Save edited product
  async saveEdit() {
    if (!this.editingProduct.name.trim()) return alert('Product name cannot be empty.');
    this.loading = true;

    try {
      const productDoc = doc(this.firestore, 'products', this.editingProduct.id);

      const cat = this.categories.find(c => c.id === this.editingProduct.categoryId);
      const sub = this.subcategories.find(s => s.id === this.editingProduct.subcategoryId);

      await updateDoc(productDoc, {
        name: this.editingProduct.name,
        categoryId: cat?.id || '',
        categoryName: cat?.name || '',
        subcategoryId: sub?.id || '',
        subcategoryName: sub?.name || '',
        price: Number(this.editingProduct.price),
        stock: Number(this.editingProduct.stock),
      });

      alert('✅ Product updated successfully!');
      this.editingProduct = null;
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Error updating product. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  // ❌ Cancel editing
  cancelEdit() {
    this.editingProduct = null;
  }
}
