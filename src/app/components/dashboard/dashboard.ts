import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { SalesService } from '../../services/sales';
import { ChartOptions } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  totalProducts = 0;
  totalStock = 0;
  outOfStock = 0;
  lowStock = 0;
  fastMoving = 0;
  deadStock = 0;
  totalSalesAmount = 0;

  categoryCounts: { [key: string]: number } = {};
  categoryStock: { [key: string]: number } = {};

  // Charts
  stockPieData: any;
  categoryBarData: any;
  monthlySalesData: any;
  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
    },
  };

  constructor(private ps: ProductService, private ss: SalesService) {}

  ngOnInit() {
    this.loadProducts();
    this.loadSales();
  }

  private safeNumber(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  private loadProducts() {
    this.ps.getProducts().subscribe((products) => {
      this.totalProducts = products.length;
      this.totalStock = products.reduce((s, p) => s + this.safeNumber(p.stock), 0);

      // Low stock = stock <= minStock
      this.lowStock = products.filter(p => this.safeNumber(p.stock) <= this.safeNumber(p.minStock || 0)).length;

      // Out of stock = stock == 0
      this.outOfStock = products.filter(p => this.safeNumber(p.stock) <= 0).length;

      // Fast moving
      const FAST_THRESHOLD = 10;
      this.fastMoving = products.filter(p => this.safeNumber(p.salesCount) > FAST_THRESHOLD).length;

      // Dead stock = stock > 0 but never sold or last sold > 90 days
      const now = Date.now();
      const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
      this.deadStock = products.filter(p => {
        const stock = this.safeNumber(p.stock);
        if (stock <= 0) return false; // only in-stock products
        if (!p.lastSoldAt) return true; // never sold
        const lastSold = p.lastSoldAt.seconds
          ? new Date(p.lastSoldAt.seconds * 1000)
          : new Date(p.lastSoldAt);
        return now - lastSold.getTime() > DAYS_90_MS;
      }).length;

      // Category wise counts and stock
      this.categoryCounts = {};
      this.categoryStock = {};
      products.forEach(p => {
        const cat = p.categoryName || 'Uncategorized';
        this.categoryCounts[cat] = (this.categoryCounts[cat] || 0) + 1;
        this.categoryStock[cat] = (this.categoryStock[cat] || 0) + this.safeNumber(p.stock);
      });

      // Prepare charts
      this.prepareStockPieChart();
      this.prepareCategoryBarChart();
    });
  }

  private loadSales() {
    this.ss.getSales().subscribe(sales => {
      let total = 0;
      const monthlyMap: { [key: string]: number } = {};

      for (const s of sales) {
        let t = this.safeNumber(s.total);
        if (t <= 0 && Array.isArray(s.items)) {
          t = s.items.reduce((sum: number, i: any) => sum + this.safeNumber(i.price) * this.safeNumber(i.qty), 0);
        }
        total += t;

        // Monthly aggregation
        const dateObj = s.date?.seconds ? new Date(s.date.seconds * 1000) : new Date(s.date || Date.now());
        if (!isNaN(dateObj.getTime())) {
          const key = `${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`;
          monthlyMap[key] = (monthlyMap[key] || 0) + t;
        }
      }

      this.totalSalesAmount = total;

      // Prepare monthly sales chart
      const labels = Object.keys(monthlyMap).sort((a, b) => {
        const [am, ay] = a.split('-').map(Number);
        const [bm, by] = b.split('-').map(Number);
        return new Date(ay, am-1).getTime() - new Date(by, bm-1).getTime();
      });
      const data = labels.map(l => monthlyMap[l] || 0);
      this.monthlySalesData = {
        labels,
        datasets: [{ label: 'Monthly Sales (₹)', data, backgroundColor: '#42A5F5' }]
      };
    });
  }

  private prepareStockPieChart() {
    this.stockPieData = {
      labels: ['In Stock (products)', 'Out of Stock (products)'],
      datasets: [
        { data: [this.totalProducts - this.outOfStock, this.outOfStock], backgroundColor: ['#42A5F5', '#FF6384'] }
      ]
    };
  }

  private prepareCategoryBarChart() {
    const labels = Object.keys(this.categoryCounts);
    const productData = labels.map(l => this.categoryCounts[l]);
    const stockData = labels.map(l => this.categoryStock[l] || 0);
    this.categoryBarData = {
      labels,
      datasets: [
        { label: 'Products', data: productData, backgroundColor: '#66BB6A' },
        { label: 'Stock Qty', data: stockData, backgroundColor: '#FFA726' }
      ]
    };
  }
}
