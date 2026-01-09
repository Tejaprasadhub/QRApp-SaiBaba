import { Component, OnInit } from '@angular/core';
import { RepairsService } from '../../services/repairs.service';
import { FirestoreLoaderService } from '../../services/firestore-loader.service';
import { take } from 'rxjs';
import { CustomerService } from '../../services/customer.service';
import { CustomerProfileService } from '../../services/campaigns-ai/customer-profile.service';
import { doc, Firestore, serverTimestamp, updateDoc } from '@angular/fire/firestore';

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

  constructor(private repairService: RepairsService,
    private fsLoader: FirestoreLoaderService,
    private customerService: CustomerService,
    private customerProfileService: CustomerProfileService,
    private firestore: Firestore  
  ) {}

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

    this.fsLoader
    .wrapObservable(this.repairService.getRepairs(
      {
        status: this.filterStatus,
        start: range.start,
        end: range.end
      },
      this.pageSize,
      this.lastDoc,
      this.realtime
    ).pipe(take(1))).subscribe(list => {
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
async addPayment(r: any) {
  const value = prompt(`Enter amount received now:`, '0');
  if (!value) return;

  const amt = Number(value);
  if (isNaN(amt) || amt <= 0) {
    alert("Invalid amount");
    return;
  }

  const newPaid = (r.paidAmount || 0) + amt;
  const newPending = Math.max((r.estimatedAmount || 0) - newPaid, 0);

  try {
    // 1️⃣ Update repair payment
    await this.fsLoader.wrapPromise(
      this.repairService.updatePayment(r.id, newPaid, newPending)
    );

    // 2️⃣ Find customer by phone
    const customer = await this.customerService.getCustomerByPhone(
      r.customerPhone
    );

    if (customer) {
      // 3️⃣ Update lastVisitAt (payment = physical visit)
      await this.customerService.updateCustomer(customer.id, {
        lastVisitAt: new Date()
      });

      // 4️⃣ Recompute AI tag safely
      this.customerProfileService
        .getCustomerProfile$(customer)
        .pipe(take(1))
        .subscribe(async ({ aiTag }) => {
          await this.customerService.updateCustomer(customer.id, {
            aiTag
          });
        });
    }

    // 5️⃣ Reload UI
    this.load(true);

  } catch (err) {
    alert('Failed to complete repair payment');
  }
}


// ======================================================
  // 🎉 COMPLETE WITH PAYMENT (Full or Partial)
  // ======================================================
async completeWithPayment(r: any) {
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
    
  try {
    // 1️⃣ Update repair payment
    await this.fsLoader.wrapPromise(
     this.repairService.markCompleted(r.id, newPaid, newPending)
    );

    // 2️⃣ Find customer by phone
    const customer = await this.customerService.getCustomerByPhone(
      r.customerPhone
    );

    if (customer) {
      // 3️⃣ Update lastVisitAt (payment = physical visit)
      await this.customerService.updateCustomer(customer.id, {
        lastVisitAt: new Date()
      });

      // 4️⃣ Recompute AI tag safely
      this.customerProfileService
        .getCustomerProfile$(customer)
        .pipe(take(1))
        .subscribe(async ({ aiTag }) => {
          await this.customerService.updateCustomer(customer.id, {
            aiTag
          });
        });
    }

    // 5️⃣ Reload UI
    this.load(true);

  } catch (err) {
    alert('Failed to complete repair payment');
  }
}


  // ======================================================
  // 🎉 COMPLETE WITH PAYMENT (Full or Partial)
  // ======================================================
//  async completeWithPayment(r: any) {
//     const value = prompt(
//       `Customer is taking the device.\nEnter amount received now:\nPending: ₹${r.pendingAmount}`,
//       r.pendingAmount
//     );

//     if (value === null) return;
//     const amt = Number(value);

//     if (isNaN(amt) || amt < 0) {
//       alert("Invalid amount");
//       return;
//     }

//     const newPaid = (r.paidAmount || 0) + amt;
//     const newPending = Math.max((r.estimatedAmount || 0) - newPaid, 0);
    

// this.fsLoader.wrapPromise(
//     this.repairService.markCompleted(r.id, newPaid, newPending)
//   ).then(() => {

//      // 🟢 NEW — Update customer's last visit & AITag
   
//     // 2️⃣ Find customer by phone
//     const customer = await this.customerService.getCustomerByPhone(
//       r.customerPhone
//     );

//     if (customer) {
//       // 3️⃣ Update lastVisitAt (payment = physical visit)
//       await this.customerService.updateCustomer(customer.id, {
//         lastVisitAt: new Date()
//       });

//       // 4️⃣ Recompute AI tag safely
//       this.customerProfileService
//         .getCustomerProfile$(customer)
//         .pipe(take(1))
//         .subscribe(async ({ aiTag }) => {
//           await this.customerService.updateCustomer(customer.id, {
//             aiTag
//           });
//         });
//     }


//     this.load(true);
//     // ✅ optional success UI
//   }).catch(() => {
//     alert('Failed to complete repair');
//   });  

// }

  // Calculate the total service amount
  get totalServiceAmount(): number {
    return this.filtered.reduce((total, repair) => total + (repair.serviceAmount || 0), 0);
  }


  // Add service amount to the repair
addServiceAmount(r: any) {
  const value = prompt(`Enter service amount for repair: ₹${r.serviceAmount}`, r.serviceAmount);
  if (!value) return;

  const amt = Number(value);
  if (isNaN(amt) || amt <= 0) {
    alert("Invalid amount");
    return;
  }

  const newServiceAmount = amt;

  this.fsLoader.wrapPromise(
    this.repairService.updateServiceAmount(r.id, newServiceAmount)
  ).then(() => {
    this.load(true);
    // ✅ optional success UI
  }).catch(() => {
    alert('Failed to add service amount');
  });
}

}
