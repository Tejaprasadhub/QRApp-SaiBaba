import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ProductService } from '../../services/product';
import { SalesService } from '../../services/sales';
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
totalProducts = 0;
  totalStock = 0;
  outOfStock = 0;
  fastMoving = 0;
  deadStock = 0;
  totalSalesAmount = 0;

  // // chart data
  // public barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [{ data: [], label: 'Sales' }] };
  // public barChartOptions: ChartOptions<'bar'> = { responsive: true };

  constructor(private ps: ProductService, private ss: SalesService) {}

  ngOnInit() {
    this.ps.getProducts().subscribe(products => {
      this.totalProducts = products.length;
      this.totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
      this.outOfStock = products.filter(p => (p.stock || 0) === 0).length;
      const now = new Date();
      this.fastMoving = products.filter(p => (p.salesCount || 0) > 10).length;
      this.deadStock = products.filter(p => {
        if (!p.lastSoldAt) return true; // never sold → considered dead
        const last = new Date(p.lastSoldAt.seconds ? p.lastSoldAt.seconds * 1000 : p.lastSoldAt);
        const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays > 90;
      }).length;
    });

    this.ss.getSales().subscribe(sales => {
      this.totalSalesAmount = sales.reduce((s, sale) => s + (sale.total || 0), 0);

      // monthly aggregation
      const map: { [k: string]: number } = {};
      for (const sale of sales) {
        const date = new Date(sale.date?.seconds ? sale.date.seconds * 1000 : sale.date);
        const key = `${date.getMonth() + 1}-${date.getFullYear()}`;
        map[key] = (map[key] || 0) + (sale.total || 0);
      }
      const sortedKeys = Object.keys(map).sort((a,b) => {
        const [am, ay] = a.split('-').map(Number);
        const [bm, by] = b.split('-').map(Number);
        return new Date(ay, am-1).getTime() - new Date(by, bm-1).getTime();
      });
      // this.barChartData.labels = sortedKeys;
      // this.barChartData.datasets = [{ data: sortedKeys.map(k => map[k]), label: 'Monthly Sales (₹)' }];
    });
  }
}
