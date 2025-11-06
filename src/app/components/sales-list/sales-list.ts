import { Component } from '@angular/core';
import { SalesService } from '../../services/sales';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-sales-list',
  standalone: false,
  templateUrl: './sales-list.html',
  styleUrl: './sales-list.scss',
})
export class SalesList {
  sales: any[] = [];
  filteredSales: any[] = [];

  // Filters
  filterCustomer: string = '';
  filterFromDate: string = '';
  filterToDate: string = '';

  // Charts
  public monthlyChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [{ data: [], label: 'Monthly Sales (₹)' }] };
  public monthlyChartOptions: ChartOptions<'bar'> = { responsive: true };

  public productChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [{ data: [], label: 'Units Sold' }] };
  public productChartOptions: ChartOptions<'bar'> = { responsive: true };

  productSummary: any[] = [];

  constructor(private ss: SalesService) {}

  ngOnInit() {
    this.ss.getSales().subscribe(s => {
      // Sort latest first
      this.sales = s.sort((a, b) => {
        const aDate = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime();
        const bDate = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date).getTime();
        return bDate - aDate;
      });

      this.filteredSales = [...this.sales];
      this.updateMonthlyChart();
      this.updateProductSummary();
    });
  }

  // Format date safely
  getFormattedDate(date: any): Date | null {
    if (!date) return null;
    if (date.toDate) return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    return new Date(date);
  }

  getTotalItems(sale: any) {
    return sale.items.reduce((sum: number, i: any) => sum + (i.qty || 0), 0);
  }

  // Filter sales by customer and date range
  applyFilters() {
    this.filteredSales = this.sales.filter(s => {
      const customerMatch = !this.filterCustomer || s.customer?.toLowerCase().includes(this.filterCustomer.toLowerCase());
      const saleDate = this.getFormattedDate(s.date);
      const fromDate = this.filterFromDate ? new Date(this.filterFromDate) : null;
      const toDate = this.filterToDate ? new Date(this.filterToDate) : null;

      const fromMatch = !fromDate || (saleDate && saleDate >= fromDate);
      const toMatch = !toDate || (saleDate && saleDate <= toDate);

      return customerMatch && fromMatch && toMatch;
    });

    this.updateMonthlyChart();
    this.updateProductSummary();
  }

  // Monthly sales chart
  updateMonthlyChart() {
    const map: { [k: string]: number } = {};
    for (const sale of this.filteredSales) {
      const date = this.getFormattedDate(sale.date);
      if (!date) continue;
      const key = `${date.getMonth() + 1}-${date.getFullYear()}`;
      map[key] = (map[key] || 0) + (sale.total || 0);
    }

    const sortedKeys = Object.keys(map).sort((a,b) => {
      const [am, ay] = a.split('-').map(Number);
      const [bm, by] = b.split('-').map(Number);
      return new Date(ay, am-1).getTime() - new Date(by, bm-1).getTime();
    });

    this.monthlyChartData.labels = sortedKeys;
    this.monthlyChartData.datasets = [{ data: sortedKeys.map(k => map[k]), label: 'Monthly Sales (₹)' }];
  }

  // Product-wise summary
  updateProductSummary() {
    const productMap: { [name: string]: number } = {};

    for (const sale of this.filteredSales) {
      for (const item of sale.items) {
        productMap[item.name] = (productMap[item.name] || 0) + (item.qty || 0);
      }
    }

    this.productSummary = Object.entries(productMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty); // descending order

    this.productChartData.labels = this.productSummary.map(p => p.name);
    this.productChartData.datasets = [{ data: this.productSummary.map(p => p.qty), label: 'Units Sold' }];
  }
}
