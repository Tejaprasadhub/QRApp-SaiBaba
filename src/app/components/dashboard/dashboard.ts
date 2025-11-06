import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { SalesService } from '../../services/sales';
import { ChartOptions } from 'chart.js';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  // 📦 Product metrics
  totalProducts = 0;
  totalStock = 0;
  outOfStock = 0;
  lowStock = 0;
  fastMoving = 0;
  deadStock = 0;

  // 💰 Financial metrics
  totalSalesAmount = 0;
  totalProfit = 0;

  // 🧾 Purchase metrics
  totalPurchaseCount = 0;
  totalPurchaseValue = 0;
  totalPurchaseReceivedValue = 0; // ✅ NEW metric

  // 🔍 Filters
  filterFromDate: string = '';
  filterToDate: string = '';

  categoryCounts: { [key: string]: number } = {};
  categoryStock: { [key: string]: number } = {};

  // 📊 Charts
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

  private allSales: any[] = [];

  constructor(
    private ps: ProductService,
    private ss: SalesService,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadSales();
    this.loadPurchaseOrders();
  }

  // ✅ Safely convert values
  private safeNumber(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  // 📦 Load Products
  private loadProducts() {
    this.ps.getProducts().subscribe((products) => {
      this.totalProducts = products.length;
      this.totalStock = products.reduce((s, p) => s + this.safeNumber(p.stock), 0);

      this.lowStock = products.filter(
        (p) => this.safeNumber(p.stock) <= this.safeNumber(p.minStock || 0)
      ).length;
      this.outOfStock = products.filter((p) => this.safeNumber(p.stock) <= 0).length;

      const FAST_THRESHOLD = 10;
      this.fastMoving = products.filter(
        (p) => this.safeNumber(p.salesCount) > FAST_THRESHOLD
      ).length;

      const now = Date.now();
      const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
      this.deadStock = products.filter((p) => {
        const stock = this.safeNumber(p.stock);
        if (stock <= 0) return false;
        if (!p.lastSoldAt) return true;
        const lastSold = p.lastSoldAt.seconds
          ? new Date(p.lastSoldAt.seconds * 1000)
          : new Date(p.lastSoldAt);
        return now - lastSold.getTime() > DAYS_90_MS;
      }).length;

      this.categoryCounts = {};
      this.categoryStock = {};
      products.forEach((p) => {
        const cat = p.categoryName || 'Uncategorized';
        this.categoryCounts[cat] = (this.categoryCounts[cat] || 0) + 1;
        this.categoryStock[cat] =
          (this.categoryStock[cat] || 0) + this.safeNumber(p.stock);
      });

      this.prepareStockPieChart();
      this.prepareCategoryBarChart();
    });
  }

  // 💰 Load Sales and calculate total + profit
  private loadSales() {
    this.ss.getSales().subscribe((sales) => {
      this.allSales = sales;
      this.applyDateFilter();
    });
  }

  // 📆 Apply From–To filter
  applyDateFilter() {
    let filtered = [...this.allSales];
    if (this.filterFromDate || this.filterToDate) {
      const from = this.filterFromDate ? new Date(this.filterFromDate) : null;
      const to = this.filterToDate ? new Date(this.filterToDate) : null;

      filtered = filtered.filter((s) => {
        const d = s.date?.seconds
          ? new Date(s.date.seconds * 1000)
          : new Date(s.date);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    this.calculateSalesAndProfit(filtered);
  }

  // 🧮 Compute total sales and profit
  private calculateSalesAndProfit(sales: any[]) {
    let totalSales = 0;
    let totalProfit = 0;
    const monthlyMap: { [k: string]: { sales: number; profit: number } } = {};

    for (const s of sales) {
      const dateObj = s.date?.seconds
        ? new Date(s.date.seconds * 1000)
        : new Date(s.date || Date.now());
      const key = `${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`;

      let saleTotal = 0;
      let saleProfit = 0;

      for (const item of s.items || []) {
        const qty = this.safeNumber(item.qty);
        const cost = this.safeNumber(
          item.costPrice || item.purchasePrice || item.priceCost || 0
        );
        const sell = this.safeNumber(
          item.sellingPrice || item.salePrice || item.price || 0
        );
        saleTotal += sell * qty;
        saleProfit += (sell - cost) * qty;
      }

      totalSales += saleTotal;
      totalProfit += saleProfit;

      monthlyMap[key] = monthlyMap[key] || { sales: 0, profit: 0 };
      monthlyMap[key].sales += saleTotal;
      monthlyMap[key].profit += saleProfit;
    }

    this.totalSalesAmount = Math.round(totalSales);
    this.totalProfit = Math.round(totalProfit);

    const labels = Object.keys(monthlyMap).sort((a, b) => {
      const [am, ay] = a.split('-').map(Number);
      const [bm, by] = b.split('-').map(Number);
      return new Date(ay, am - 1).getTime() - new Date(by, bm - 1).getTime();
    });

    this.monthlySalesData = {
      labels,
      datasets: [
        {
          label: 'Monthly Sales (₹)',
          data: labels.map((k) => monthlyMap[k].sales),
          backgroundColor: '#42A5F5',
        },
        {
          label: 'Monthly Profit (₹)',
          data: labels.map((k) => monthlyMap[k].profit),
          backgroundColor: '#66BB6A',
        },
      ],
    };
  }

  // 🧾 Load Purchase Orders & calculate totals
  private loadPurchaseOrders() {
    const purchaseRef = collection(this.firestore, 'purchaseOrders');
    collectionData(purchaseRef, { idField: 'id' }).subscribe((orders) => {
      this.totalPurchaseCount = orders.length || 0;

      let totalValue = 0;
      let totalReceived = 0;

      for (const o of orders) {
        if (Array.isArray(o['items'])) {
          for (const i of o['items']) {
            const qty = this.safeNumber(i.orderQty || 0);
            const rcvQty = this.safeNumber(i.receivedQty || 0);
            const price = this.safeNumber(i.newPrice || i.price || 0);

            totalValue += qty * price;
            totalReceived += rcvQty * price;
          }
        }
      }

      this.totalPurchaseValue = Math.round(totalValue);
      this.totalPurchaseReceivedValue = Math.round(totalReceived);
    });
  }

  // 📊 Charts
  private prepareStockPieChart() {
    this.stockPieData = {
      labels: ['In Stock', 'Out of Stock'],
      datasets: [
        {
          data: [this.totalProducts - this.outOfStock, this.outOfStock],
          backgroundColor: ['#42A5F5', '#FF6384'],
        },
      ],
    };
  }

  private prepareCategoryBarChart() {
    const labels = Object.keys(this.categoryCounts);
    const productData = labels.map((l) => this.categoryCounts[l]);
    const stockData = labels.map((l) => this.categoryStock[l] || 0);
    this.categoryBarData = {
      labels,
      datasets: [
        { label: 'Products', data: productData, backgroundColor: '#66BB6A' },
        { label: 'Stock Qty', data: stockData, backgroundColor: '#FFA726' },
      ],
    };
  }
}
