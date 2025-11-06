import { Component } from '@angular/core';
import { CategoryService } from '../../services/category';
import { Firestore, collection, query, where, getDocs, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList {
  categories: any[] = [];
  newCat = { name: '' };
  editCat: any = null; // track the category being edited
  loading = false;

  constructor(
    private cs: CategoryService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.cs.getCategories().subscribe(c => (this.categories = c));
  }

  // 🟢 Add category (duplicate check ignoring case)
  async add() {
    const name = this.newCat.name.trim().toUpperCase();
    if (!name) return alert('Category name is required');

    const upper = name;
    this.loading = true;

    try {
      const catRef = collection(this.firestore, 'categories');
      const existingSnap = await getDocs(catRef);

      const duplicate = existingSnap.docs.find(
        doc => doc.data()['name']?.toString().toUpperCase() === upper
      );

      if (duplicate) {
        alert(`Category "${name}" already exists.`);
        this.loading = false;
        return;
      }

      await this.cs.addCategory({ name });
      alert('✅ Category added successfully!');
      this.newCat = { name: '' };
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Error adding category. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  // ✏️ Start editing a category
  startEdit(cat: any) {
    this.editCat = { ...cat };
  }

  // 💾 Save updated category
  async saveEdit() {
    if (!this.editCat.name.trim()) return alert('Name cannot be empty');
    const upper = this.editCat.name.trim().toUpperCase();

    try {
      // Duplicate check (excluding current category)
      const catRef = collection(this.firestore, 'categories');
      const existingSnap = await getDocs(catRef);

      const duplicate = existingSnap.docs.find(
        doc =>
          doc.data()['name']?.toString().toUpperCase() === upper &&
          doc.id !== this.editCat.id
      );

      if (duplicate) {
        alert(`Category "${this.editCat.name}" already exists.`);
        return;
      }

      // ✅ Update category name
      const catDoc = doc(this.firestore, 'categories', this.editCat.id);
      await updateDoc(catDoc, { name: this.editCat.name });

      alert('✅ Category updated successfully!');
      this.editCat = null;
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Error updating category. Please try again.');
    }
  }

  // ❌ Cancel editing
  cancelEdit() {
    this.editCat = null;
  }

  // 🔴 Delete category (only if no products exist)
  async remove(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const productRef = collection(this.firestore, 'products');
      const q = query(productRef, where('categoryId', '==', id));
      const productSnap = await getDocs(q);

      if (!productSnap.empty) {
        alert('⚠️ Cannot delete this category because products exist under it.');
        return;
      }

      await this.cs.deleteCategory(id);
      alert('✅ Category deleted successfully.');
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Error deleting category. Please try again.');
    }
  }
}
