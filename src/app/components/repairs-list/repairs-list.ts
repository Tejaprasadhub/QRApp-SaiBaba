import { Component, OnInit } from '@angular/core';
import { RepairsService } from '../../services/repairs.service';

@Component({
  selector: 'app-repairs-list',
  standalone: false,
  templateUrl: './repairs-list.html',
  styleUrls: ['./repairs-list.scss']
})
export class RepairsList implements OnInit {

  repairs: any[] = [];
  filtered: any[] = [];
  lastDoc: any = null;

  // filters
  filterStatus = '';
  searchText = '';

  // date range
// ✅ string values for date inputs
  startDateStr!: string;
  endDateStr!: string;

  // pagination
  pageSize = 10;

  // realtime
  realtime = true;

  constructor(private repairService: RepairsService) {}

  ngOnInit() {
    this.setDefaultDates();
    this.load(true);
  }

  // ✅ TODAY default
  setDefaultDates() {
    const today = new Date();
    this.startDateStr = this.formatDate(today);
    this.endDateStr = this.formatDate(today);
  }

  // ✅ yyyy-MM-dd
  private formatDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ✅ convert input values → real range
  private getDateRange() {
    const start = new Date(`${this.startDateStr}T00:00:01`);
    const end = new Date(`${this.endDateStr}T23:59:59`);

    if (end < start) {
      throw new Error('End date cannot be before start date');
    }

    return { start, end };
  }

  load(reset = false) {
    if (reset) {
      this.lastDoc = null;
      this.repairs = [];
    }

    let range;
    try {
      range = this.getDateRange();
    } catch {
      alert('Invalid date range');
      return;
    }

    this.repairService.getRepairs(
      {
        status: this.filterStatus,
        start: range.start,
        end: range.end
      },
      this.pageSize,
      this.lastDoc,
      this.realtime
    ).subscribe(list => {
      if (list.length) {
        this.lastDoc = list[list.length - 1];
        this.repairs = reset ? list : [...this.repairs, ...list];
        this.applySearch();
      } else if (reset) {
        this.filtered = [];
      }
    });
  }

  // 🔍 search
  applySearch() {
    const q = this.searchText.toLowerCase();
    this.filtered = !q
      ? this.repairs
      : this.repairs.filter(r =>
          r.customerName?.toLowerCase().includes(q) ||
          r.customerPhone?.includes(q)
        );
  }

  // ✅ fires for start OR end change
  onFiltersChanged() {
    this.load(true);
  }

  // ======================================================
  // 😎 ADD PAYMENT ANYTIME (Before or After Completion)
  // ======================================================
  addPayment(r: any) {
    const value = prompt(`Enter amount received now:`, '0');
    if (!value) return;

    const amt = Number(value);
    if (isNaN(amt) || amt <= 0) {
      alert("Invalid amount");
      return;
    }

    const newPaid = (r.paidAmount || 0) + amt;
    const newPending = Math.max((r.estimatedAmount || 0) - newPaid, 0);

    this.repairService.updatePayment(r.id, newPaid, newPending);
  }

  // ======================================================
  // 🎉 COMPLETE WITH PAYMENT (Full or Partial)
  // ======================================================
  completeWithPayment(r: any) {
    const value = prompt(
      `Customer is taking the device.\nEnter amount received now:\nPending: ₹${r.pendingAmount}`,
      r.pendingAmount
    );

    if (value === null) return;
    const amt = Number(value);

    if (isNaN(amt) || amt < 0) {
      alert("Invalid amount");
      return;
    }

    const newPaid = (r.paidAmount || 0) + amt;
    const newPending = Math.max((r.estimatedAmount || 0) - newPaid, 0);

    this.repairService.markCompleted(r.id, newPaid, newPending);
  }
}
