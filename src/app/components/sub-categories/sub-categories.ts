import { Component } from '@angular/core';
import { SubcategoryService } from '../../services/sub-category';
import { CategoryService } from '../../services/category';
import { Firestore, collection, query, where, getDocs, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-sub-categories',
  standalone: false,
  templateUrl: './sub-categories.html',
  styleUrl: './sub-categories.scss',
})
export class SubCategories {
  categories: any[] = [];
  subcategories: any[] = [];
  newSub = { categoryId: '', name: '' };
  editSub: any = null; // currently editing subcategory
  loading = false;

  constructor(
    private ss: SubcategoryService,
    private cs: CategoryService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.cs.getCategories().subscribe(c => (this.categories = c));
    this.ss.getSubcategories().subscribe(s => (this.subcategories = s));
  }

  // 🟢 Add subcategory with duplicate check (case-insensitive)
  async add() {
    const name = this.newSub.name.trim().toUpperCase();
    if (!name || !this.newSub.categoryId) {
      alert('Please select a category and enter a subcategory name.');
      return;
    }

    const cat = this.categories.find(c => c.id === this.newSub.categoryId);
    const upper = name;
    this.loading = true;

    try {
      // Duplicate check — same category + same name (case-insensitive)
      const subRef = collection(this.firestore, 'subcategories');
      const snap = await getDocs(subRef);

      const duplicate = snap.docs.find(
        doc =>
          doc.data()['categoryId'] === this.newSub.categoryId &&
          doc.data()['name']?.toString().toUpperCase() === upper
      );

      if (duplicate) {
        alert(`Subcategory "${name}" already exists under category "${cat.name}".`);
        this.loading = false;
        return;
      }

      await this.ss.add({
        name,
        categoryId: cat.id,
        categoryName: cat.name
      });

      alert('✅ Subcategory added successfully!');
      this.newSub = { categoryId: '', name: '' };
    } catch (err) {
      console.error('Error adding subcategory:', err);
      alert('Error adding subcategory. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  // ✏️ Start editing
  startEdit(sub: any) {
    this.editSub = { ...sub };
  }

  // 💾 Save edited subcategory name
  async saveEdit() {
    if (!this.editSub.name.trim()) return alert('Name cannot be empty');
    const upper = this.editSub.name.trim().toUpperCase();

    try {
      // Duplicate check within same category (excluding current)
      const subRef = collection(this.firestore, 'subcategories');
      const snap = await getDocs(subRef);

      const duplicate = snap.docs.find(
        doc =>
          doc.data()['categoryId'] === this.editSub.categoryId &&
          doc.data()['name']?.toString().toUpperCase() === upper &&
          doc.id !== this.editSub.id
      );

      if (duplicate) {
        alert(`Subcategory "${this.editSub.name}" already exists under this category.`);
        return;
      }

      // ✅ Update Firestore document
      const subDoc = doc(this.firestore, 'subcategories', this.editSub.id);
      await updateDoc(subDoc, { name: this.editSub.name });

      alert('✅ Subcategory updated successfully!');
      this.editSub = null;
    } catch (err) {
      console.error('Error updating subcategory:', err);
      alert('Error updating subcategory. Please try again.');
    }
  }

  // ❌ Cancel editing
  cancelEdit() {
    this.editSub = null;
  }

  // 🔴 Delete subcategory (only if no products exist)
  async remove(id: string) {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      const productRef = collection(this.firestore, 'products');
      const q = query(productRef, where('subcategoryId', '==', id));
      const productSnap = await getDocs(q);

      if (!productSnap.empty) {
        alert('⚠️ Cannot delete this subcategory because products exist under it.');
        return;
      }

      await this.ss.deleteSubcategory(id);
      alert('✅ Subcategory deleted successfully.');
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      alert('Error deleting subcategory. Please try again.');
    }
  }
}
