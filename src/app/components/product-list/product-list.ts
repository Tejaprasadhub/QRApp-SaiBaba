import { Component } from '@angular/core';
import { ProductService } from '../../services/product';
import { CategoryService } from '../../services/category';
import { SubcategoryService } from '../../services/sub-category';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Subject, debounceTime, take } from 'rxjs';
import { FirestoreLoaderService } from '../../services/firestore-loader.service';

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

  // 🔥 debounce subject
  nameFilter$ = new Subject<string>();

  // pagination
  totalRecords = 0;
  currentPage = 0;
  rowsPerPage = 10;
  lastDoc: any = null;

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
    private firestore: Firestore,
    private fsLoader: FirestoreLoaderService
  ) {}

  ngOnInit() {
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });

  this.fsLoader
  .wrapObservable(
    this.cs.getCategories().pipe(take(1))
  )
  .subscribe(c => {
    this.categories = c;
  });

this.fsLoader
  .wrapObservable(
    this.ss.getSubcategories().pipe(take(1))
  )
  .subscribe(s => {
    this.subcategories = s;
  });



    // 🔥 Debounce for name input
    this.nameFilter$
      .pipe(debounceTime(250))
      .subscribe(value => {
        this.filterName = value.toLowerCase();
        // this.loadServerProducts();
        // Pass a pageChange object with page:0 so loadServerProducts resets properly
        this.loadServerProducts({ page: 0 });
      });

    this.loadServerProducts();
  }

  async loadServerProducts(pageChange: any = null) {
    this.loading = true;

    const isNameFilter = !!this.filterName.trim();

    // Reset on page=0 or filter change
    if (!pageChange || pageChange.page === 0 || isNameFilter) {
      this.products = [];
      this.lastDoc = null;
      this.currentPage = 0;
    }

    try {

      // If name filter → client-side pagination mode
      if (isNameFilter) {
        const res = await await this.fsLoader.wrapPromise(this.ps.getProductsPaginated(
          {
            name: this.filterName.trim(),
            categoryId: this.filterCategoryId,
            subcategoryId: this.filterSubcategoryId
          },
          this.rowsPerPage,
          null
        ));

        this.products = res.products;       // load all
        this.totalRecords = this.products.length;  // full count
        return;
      }

      this.totalRecords = await this.fsLoader.wrapPromise(
  this.ps.getProductsCount({
    name: '',
    categoryId: this.filterCategoryId,
    subcategoryId: this.filterSubcategoryId
  })
);

      const res = await await this.fsLoader.wrapPromise(this.ps.getProductsPaginated(
        {
          name: '',
          categoryId: this.filterCategoryId,
          subcategoryId: this.filterSubcategoryId
        },
        this.rowsPerPage,
        this.lastDoc
      ));

      // 🔥 IMPORTANT FIX → REPLACE instead of APPEND
  this.products = res.products;

      // this.products = [...this.products, ...res.products];
      this.lastDoc = res.lastDoc;

    } finally {
      this.loading = false;
    }
  }


  // -------------------------------------------------------
  // FILTER EVENTS
  // -------------------------------------------------------
  onNameInput(event: any) {
    this.nameFilter$.next(event.target.value);
  }

  onFiltersChanged() {
    this.loadServerProducts();
  }

  onCategoryChange(categoryId: string) {
    this.filterCategoryId = categoryId;
    this.filterSubcategoryId = '';
            this.loadServerProducts({ page: 0 });

    //this.onFiltersChanged();
  }

  clearFilters() {
    this.filterName = '';
    this.filterCategoryId = '';
    this.filterSubcategoryId = '';
    this.filterStockMin = null;
    this.filterStockMax = null;
    this.loadServerProducts();
  }

  // -------------------------------------------------------
  // Pagination
  // -------------------------------------------------------
 onPageChange(event: any) {
  this.rowsPerPage = event.rows;
  this.currentPage = event.page;

  // 🔥 If NAME filter is active ⇒ CLIENT pagination ⇒ DO NOT call server
  if (this.filterName.trim()) {
    return;
  }

  // Normal server-side pagination
  this.loadServerProducts(event);
}


  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  filteredSubcategoriesForFilter() {
    if (!this.filterCategoryId) return this.subcategories;
    return this.subcategories.filter(s => s.categoryId === this.filterCategoryId);
  }

  filteredSubcategories() {
    if (!this.editingProduct?.categoryId) return [];
    return this.subcategories.filter(s => s.categoryId === this.editingProduct.categoryId);
  }

  get filteredProducts() {
    return this.products.filter(p => {
      let match = true;
      if (this.filterStockMin != null) match = match && p.stock >= this.filterStockMin;
      if (this.filterStockMax != null) match = match && p.stock <= this.filterStockMax;
      return match;
    });
  }

 get paginatedProducts() {

  // NAME filter → CLIENT pagination
  if (this.filterName.trim()) {
    const start = this.currentPage * this.rowsPerPage;
    return this.filteredProducts.slice(start, start + this.rowsPerPage);
  }

  // NO NAME filter → SERVER pagination
  // Firestore already returns only the correct page
  return this.products;
}


  // totals
// Count *only current page*
get totalProducts() {
  return this.filteredProducts.length;
}

get totalStock() {
  return this.paginatedProducts.reduce(
    (sum, p) => sum + Number(p.stock || 0),
    0
  );
}

get totalMinStock() {
  return this.paginatedProducts.reduce(
    (sum, p) => sum + Number(p.minStock || 0),
    0
  );
}


  // get totalStock() {
  //   return this.filteredProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  // }
  // get totalMinStock() {
  //   return this.filteredProducts.reduce((sum, p) => sum + Number(p.minStock || 0), 0);
  // }
  get totalLowStock() {
    return this.paginatedProducts.filter(p => Number(p.stock) < Number(p.minStock || 5)).length;
  }

  // -------------------------------------------------------
  // Edit / Delete
  // -------------------------------------------------------
  startEdit(product: any) {
    this.editingProduct = { ...product };
  }

  cancelEdit() {
    this.editingProduct = null;
  }

  async saveEdit() {
    if (!this.editingProduct) return;
    if (!this.editingProduct.name.trim()) return alert('Product name cannot be empty.');

    this.loading = true;
    try {
      const productDoc = doc(this.firestore, 'products', this.editingProduct.id);
      const cat = this.categories.find(c => c.id === this.editingProduct.categoryId);
      const sub = this.subcategories.find(s => s.id === this.editingProduct.subcategoryId);

      let namekeyWords: string[] = [];
       if (this.editingProduct.name) {
      namekeyWords = this.ps.generateKeywords(this.editingProduct.name);
      }

      await this.fsLoader.wrapPromise(updateDoc(productDoc, {
        name: this.editingProduct.name,
        categoryId: cat?.id || '',
        categoryName: cat?.name || '',
        subcategoryId: sub?.id || '',
        subcategoryName: sub?.name || '',
        price: Number(this.editingProduct.price),
        stock: Number(this.editingProduct.stock),
        minStock: Number(this.editingProduct.minStock || 5),
        keywords: namekeyWords
      }));

      alert('Product updated successfully!');
      this.editingProduct = null;

      this.loadServerProducts({ page: 0 });
    } finally {
      this.loading = false;
    }
  }

  delete(id: string) {
    if (!confirm('Delete product?')) return;
    this.fsLoader
  .wrapPromise(this.ps.deleteProduct(id).then(() => {
      this.loadServerProducts({ page: 0 });
    }));
  }


}
