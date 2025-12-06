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
  filteredRepairs: any[] = [];
  filterStatus = '';


  constructor(private repairService: RepairsService) {}

  ngOnInit() {
    this.repairService.getRepairs().subscribe((list) => {
      this.repairs = list;
      this.applyFilter();
    });
  }

  // =============================
  // APPLY FILTER
  // =============================
  applyFilter() {
    if (!this.filterStatus) {
      this.filteredRepairs = this.repairs;
      return;
    }
    this.filteredRepairs = this.repairs.filter(r => r.status === this.filterStatus);
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
