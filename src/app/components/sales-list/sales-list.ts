import { Component } from '@angular/core';
import { SalesService } from '../../services/sales';

@Component({
  selector: 'app-sales-list',
  standalone: false,
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
})
export class SalesList {
sales: any[] = [];

  constructor(private ss: SalesService) {}

  ngOnInit() {
    this.ss.getSales().subscribe(s => this.sales = s.sort((a,b) => (b.date?.seconds||0) - (a.date?.seconds||0)));
  }
}
