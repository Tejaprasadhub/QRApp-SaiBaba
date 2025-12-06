import { Component } from '@angular/core';
import { Firestore, collection, query, where, collectionData } from '@angular/fire/firestore';
import { debounceTime, Subject, switchMap, of, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-customer-history',
  standalone: false,
  templateUrl: './customer-history.html',
  styleUrls: ['./customer-history.scss']
})
export class CustomerHistory {
  phone = '';
  customer: any = null;

  sales: any[] = [];
  repairs: any[] = [];
  totalSpent = 0;
  totalPending = 0;

  private searchSubject = new Subject<string>();

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(400),
        switchMap(phone => {
          if (!phone || phone.trim().length < 4) {
            this.reset();
            return of(null);
          }
          return this.loadCustomerData(phone.trim());
        })
      )
      .subscribe();
  }

  onPhoneChange() {
    this.searchSubject.next(this.phone);
  }

  reset() {
    this.customer = null;
    this.sales = [];
    this.repairs = [];
    this.totalSpent = 0;
    this.totalPending = 0;
  }

  async loadCustomerData(phone: string) {
    phone = phone.trim();
  if (!/^[6-9][0-9]{9}$/.test(phone)) return;

  this.reset();

    // ---- Load Customer ----
    const customersRef = collection(this.firestore, 'customers');
    const q = query(customersRef, where('phone', '==', phone));
   const custList = await firstValueFrom(
      collectionData(q, { idField: 'id' })
    );

    if (!custList || custList.length === 0) {
      this.customer = null;
      return;
    }

    this.customer = custList[0];

    // ---- Load Sales ----
    const salesRef = collection(this.firestore, 'sales');
    const qSales = query(salesRef, where('customerPhone', '==', phone));
this.sales = await firstValueFrom(
  collectionData(qSales, { idField: 'id' })
);
    // ---- Load Repairs ----
    const repairsRef = collection(this.firestore, 'repairs');
    const qRep = query(repairsRef, where('customerPhone', '==', phone));
this.repairs = await firstValueFrom(
  collectionData(qRep, { idField: 'id' })
);
    // ---- Calculate Summary ----
    this.totalSpent = this.sales.reduce((s, x) => s + (x.total || 0), 0);
    this.totalPending =
      (this.customer?.totalPendingAmount || 0) +
      this.repairs.reduce((s, x) => s + (x.pendingAmount || 0), 0);
  }
}
