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

  // Totals
  totalProfit: number = 0;
  totalSales: number = 0;

  // Charts
  public monthlyChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  public monthlyChartOptions: ChartOptions<'bar'> = { responsive: true };

  public productChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  public productChartOptions: ChartOptions<'bar'> = { responsive: true };

  productSummary: any[] = [];

  constructor(private ss: SalesService) {}

  ngOnInit() {
    this.ss.getSales().subscribe((s) => {
      // Sort latest first
      this.sales = s.sort((a, b) => {
        const aDate = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime();
        const bDate = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date).getTime();
        return bDate - aDate;
      });

      this.filteredSales = [...this.sales];
      this.recalculateTotals();
      this.updateMonthlyChart();
      this.updateProductSummary();
    });
  }

  getFormattedDate(date: any): Date | null {
    if (!date) return null;
    if (date.toDate) return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    return new Date(date);
  }

  getTotalItems(sale: any) {
    return sale.items.reduce((sum: number, i: any) => sum + (i.qty || 0), 0);
  }

  getSaleProfit(sale: any): number {
    if (!sale.items) return 0;
    return sale.items.reduce((sum: number, i: any) => {
      const cp = Number(i.costPrice || 0);
      const sp = Number(i.sellingPrice || i.price || 0);
      return sum + (sp - cp) * (i.qty || 0);
    }, 0);
  }

  applyFilters() {
    this.filteredSales = this.sales.filter((s) => {
      const customerMatch =
        !this.filterCustomer ||
        s.customer?.toLowerCase().includes(this.filterCustomer.toLowerCase());
      const saleDate = this.getFormattedDate(s.date);
      const fromDate = this.filterFromDate ? new Date(this.filterFromDate) : null;
      const toDate = this.filterToDate ? new Date(this.filterToDate) : null;
      const fromMatch = !fromDate || (saleDate && saleDate >= fromDate);
      const toMatch = !toDate || (saleDate && saleDate <= toDate);
      return customerMatch && fromMatch && toMatch;
    });

    this.recalculateTotals();
    this.updateMonthlyChart();
    this.updateProductSummary();
  }

  recalculateTotals() {
    this.totalSales = this.filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
    this.totalProfit = this.filteredSales.reduce(
      (sum, s) => sum + this.getSaleProfit(s),
      0
    );
  }

  updateMonthlyChart() {
    const mapSales: { [k: string]: number } = {};
    const mapProfit: { [k: string]: number } = {};

    for (const sale of this.filteredSales) {
      const date = this.getFormattedDate(sale.date);
      if (!date) continue;
      const key = `${date.getMonth() + 1}-${date.getFullYear()}`;
      const profit = this.getSaleProfit(sale);
      mapSales[key] = (mapSales[key] || 0) + (sale.total || 0);
      mapProfit[key] = (mapProfit[key] || 0) + profit;
    }

    const sortedKeys = Object.keys(mapSales).sort((a, b) => {
      const [am, ay] = a.split('-').map(Number);
      const [bm, by] = b.split('-').map(Number);
      return new Date(ay, am - 1).getTime() - new Date(by, bm - 1).getTime();
    });

    this.monthlyChartData.labels = sortedKeys;
    this.monthlyChartData.datasets = [
      { data: sortedKeys.map((k) => mapSales[k]), label: 'Monthly Sales (₹)' },
      { data: sortedKeys.map((k) => mapProfit[k]), label: 'Monthly Profit (₹)', backgroundColor: '#66BB6A' },
    ];
  }

  updateProductSummary() {
    const productMap: { [name: string]: { qty: number; profit: number } } = {};

    for (const sale of this.filteredSales) {
      for (const item of sale.items || []) {
        const name = item.name;
        const qty = item.qty || 0;
        const cp = Number(item.costPrice || 0);
        const sp = Number(item.sellingPrice || item.price || 0);
        const profit = (sp - cp) * qty;

        if (!productMap[name]) productMap[name] = { qty: 0, profit: 0 };
        productMap[name].qty += qty;
        productMap[name].profit += profit;
      }
    }

    this.productSummary = Object.entries(productMap)
      .map(([name, val]) => ({ name, qty: val.qty, profit: val.profit }))
      .sort((a, b) => b.qty - a.qty);

    this.productChartData.labels = this.productSummary.map((p) => p.name);
    this.productChartData.datasets = [
      { data: this.productSummary.map((p) => p.qty), label: 'Units Sold' },
      { data: this.productSummary.map((p) => p.profit), label: 'Profit (₹)', backgroundColor: '#FFA726' },
    ];
  }
}
