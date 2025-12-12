import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product';
import { SalesService } from '../../services/sales';
import { ChartOptions } from 'chart.js';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  getCountFromServer,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  totalProducts = 0;
  totalStock = 0;
  outOfStock = 0;
  lowStock = 0;
  fastMoving = 0;
  deadStock = 0;

  totalSalesAmount = 0;
  totalProfit = 0;

  totalPurchaseCount = 0;
  totalPurchaseValue = 0;
  totalPurchaseReceivedValue = 0;

  filterFromDate: string = '';
  filterToDate: string = '';

  categoryCounts: { [key: string]: number } = {};
  categoryStock: { [key: string]: number } = {};

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

  private safeNumber(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  // Aggregate products locally
  private aggregateProducts(products: any[]) {
    const grouped: Record<string, any> = {};
    for (const p of products) {
      const key = p.name.trim().toUpperCase();
      if (!grouped[key]) {
        grouped[key] = { ...p, totalStock: 0, subcategories: [] };
      }
      grouped[key].totalStock += this.safeNumber(p.stock);
      grouped[key].subcategories.push({
        name: p.subcategoryName,
        stock: p.stock,
        minStock: p.minStock,
      });
    }
    return Object.values(grouped);
  }

  // Load all products once (no live listener)
  private async loadProducts() {
    try {
      const productsSnap = await getDocs(collection(this.firestore, 'products'));
      const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const aggregated = this.aggregateProducts(products);

      this.totalProducts = aggregated.length;
      this.totalStock = aggregated.reduce((s, p: any) => s + p.totalStock, 0);

      this.lowStock = aggregated.filter((p: any) =>
        p.subcategories.some((s: any) => this.safeNumber(s.stock) <= this.safeNumber(s.minStock))
      ).length;

      this.outOfStock = aggregated.filter((p: any) => p.totalStock <= 0).length;

      const FAST_THRESHOLD = 10;
      this.fastMoving = aggregated.filter(
        (p: any) => this.safeNumber(p.salesCount) > FAST_THRESHOLD
      ).length;

      const now = Date.now();
      const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
      this.deadStock = aggregated.filter((p: any) => {
        const stock = this.safeNumber(p.totalStock);
        if (stock <= 0) return false;
        if (!p.lastSoldAt) return true;
        const lastSold = p.lastSoldAt.seconds
          ? new Date(p.lastSoldAt.seconds * 1000)
          : new Date(p.lastSoldAt);
        return now - lastSold.getTime() > DAYS_90_MS;
      }).length;

      this.categoryCounts = {};
      this.categoryStock = {};
      aggregated.forEach((p: any) => {
        const cat = p.categoryName || 'Uncategorized';
        this.categoryCounts[cat] = (this.categoryCounts[cat] || 0) + 1;
        this.categoryStock[cat] =
          (this.categoryStock[cat] || 0) + this.safeNumber(p.totalStock);
      });

      this.prepareStockPieChart();
      this.prepareCategoryBarChart();
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }

  // Load sales (filtering can be done server-side if desired)
  private async loadSales() {
    try {
      const salesSnap = await getDocs(collection(this.firestore, 'sales'));
      const sales = salesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      this.allSales = sales;
      this.applyDateFilter();
    } catch (err) {
      console.error('Error loading sales:', err);
    }
  }

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
        const cost = this.safeNumber(item.costPrice || item.purchasePrice || item.priceCost || 0);
        const sell = this.safeNumber(item.sellingPrice || item.salePrice || item.price || 0);
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
        { label: 'Monthly Sales (₹)', data: labels.map((k) => monthlyMap[k].sales), backgroundColor: '#42A5F5' },
        { label: 'Monthly Profit (₹)', data: labels.map((k) => monthlyMap[k].profit), backgroundColor: '#66BB6A' },
      ],
    };
  }

  // Load only completed purchase orders
  private async loadPurchaseOrders() {
    try {
      const purchaseRef = collection(this.firestore, 'purchaseOrders');
      const q = query(purchaseRef, where('status', '==', 'completed'));
      const snap = await getDocs(q);
      const orders: any[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      this.totalPurchaseCount = orders.length;

      let totalValue = 0;
      let totalReceived = 0;

      for (const o of orders) {
        if (Array.isArray(o.items)) {
          for (const i of o.items) {
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
    } catch (err) {
      console.error('Error loading purchase orders:', err);
    }
  }

  private prepareStockPieChart() {
    this.stockPieData = {
      labels: ['In Stock', 'Out of Stock'],
      datasets: [{ data: [this.totalProducts - this.outOfStock, this.outOfStock], backgroundColor: ['#42A5F5', '#FF6384'] }],
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
