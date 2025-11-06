import { Component } from '@angular/core';
import { SubcategoryService } from '../../services/sub-category';
import { CategoryService } from '../../services/category';

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

  constructor(private ss: SubcategoryService, private cs: CategoryService) {}

  ngOnInit() {
    this.cs.getCategories().subscribe(c => this.categories = c);
    this.ss.getSubcategories().subscribe(s => this.subcategories = s);
  }

  async add() {
    if (!this.newSub.name || !this.newSub.categoryId) return;
    const cat = this.categories.find(c => c.id === this.newSub.categoryId);
    await this.ss.add({ name: this.newSub.name, categoryId: cat.id, categoryName: cat.name });
    this.newSub = { categoryId: '', name: '' };
  }
}
