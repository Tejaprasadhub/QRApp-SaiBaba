import { Component } from '@angular/core';
import { ProductService } from '../../services/product';
import { CategoryService } from '../../services/category';
import { SubcategoryService } from '../../services/sub-category';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss'],
})
export class ProductList {
  products: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];
  editingProduct: any = null;
  loading = false;

  totalRecords = 0;
  currentPage = 0;
  rowsPerPage = 10;

  showFilters = false;
  filterName = '';
  filterCategoryId = '';
  filterSubcategoryId = '';
  filterStockMin: number | null = null;
  filterStockMax: number | null = null;

  isMobile = window.innerWidth < 768;

  constructor(
    private ps: ProductService,
    private cs: CategoryService,
    private ss: SubcategoryService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });

    this.ps.getProducts().subscribe(p => {
      this.products = p;
      this.totalRecords = this.filteredProducts.length;
    });

    this.cs.getCategories().subscribe(c => (this.categories = c));
    this.ss.getSubcategories().subscribe(s => (this.subcategories = s));
  }

  delete(id: string) {
    if (!confirm('Delete product?')) return;
    this.ps.deleteProduct(id);
  }

  startEdit(product: any) {
    this.editingProduct = { ...product };
  }

  filteredSubcategories() {
    if (!this.editingProduct?.categoryId) return [];
    return this.subcategories.filter(s => s.categoryId === this.editingProduct.categoryId);
  }

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
        minStock: Number(this.editingProduct.minStock) || 5,
      });

      alert('Product updated successfully!');
      this.editingProduct = null;
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Error updating product.');
    } finally {
      this.loading = false;
    }
  }

  cancelEdit() {
    this.editingProduct = null;
  }

  onCategoryChange(categoryId: string) {
    this.filterCategoryId = categoryId;
    this.filterSubcategoryId = '';
  }

  clearFilters() {
    this.filterName = '';
    this.filterCategoryId = '';
    this.filterSubcategoryId = '';
    this.filterStockMin = null;
    this.filterStockMax = null;
  }

  get filteredSubcategoriesForFilter() {
    if (!this.subcategories) return [];
    if (!this.filterCategoryId) return this.subcategories;
    return this.subcategories.filter(s => s.categoryId === this.filterCategoryId);
  }

  get filteredProducts() {
    return (this.products || []).filter(p => {
      let match = true;
      if (this.filterName)
        match = match && p.name.toLowerCase().includes(this.filterName.toLowerCase());
      if (this.filterCategoryId) match = match && p.categoryId === this.filterCategoryId;
      if (this.filterSubcategoryId) match = match && p.subcategoryId === this.filterSubcategoryId;
      if (this.filterStockMin != null) match = match && p.stock >= this.filterStockMin;
      if (this.filterStockMax != null) match = match && p.stock <= this.filterStockMax;
      return match;
    });
  }

  get paginatedProducts() {
    const start = this.currentPage * this.rowsPerPage;
    return this.filteredProducts.slice(start, start + this.rowsPerPage);
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.rowsPerPage = event.rows;
  }
}
