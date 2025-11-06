import { Component } from '@angular/core';
import { CategoryService } from '../../services/category';

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList {
categories: any[] = [];
  newCat = { name: '' };

  constructor(private cs: CategoryService) {}

  ngOnInit() {
    this.cs.getCategories().subscribe(c => this.categories = c);
  }

  async add() {
    if (!this.newCat.name.trim()) return;
    await this.cs.addCategory({ name: this.newCat.name });
    this.newCat = { name: '' };
  }

  async remove(id: string) {
    if (!confirm('Delete category?')) return;
    await this.cs.deleteCategory(id);
  }
}
