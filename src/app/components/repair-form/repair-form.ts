import { Component } from '@angular/core';
import { Firestore, collection, addDoc, query, where, collectionData, getDocs } from '@angular/fire/firestore';
import { FirestoreLoaderService } from '../../services/firestore-loader.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-repair-form',
  standalone: false,
  templateUrl: './repair-form.html',
  styleUrls: ['./repair-form.scss']
})
export class RepairForm {
phoneInput$ = new Subject<string>();

  model = {
    customerPhone: '',
    customerName: '',
    deviceName: '',
    issue: '',
    estimatedAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    status: 'pending',
    inDate: new Date(),
    completedAt: null
  };

  constructor(private firestore: Firestore,
    private fsLoader: FirestoreLoaderService
  ) {}

  // ================================
  // 🔄 Auto calculate pending amount
  // ================================
  updatePending() {
    const est = Number(this.model.estimatedAmount) || 0;
    const paid = Number(this.model.paidAmount) || 0;
    this.model.pendingAmount = Math.max(est - paid, 0);
  }

  // ================================
  // 💾 Save repair job
  // ================================
  async saveRepair() {
    const ref = collection(this.firestore, 'repairs');

    const payload = {
      ...this.model,
      inDate: new Date()
    };

    await this.fsLoader.wrapPromise(
      addDoc(ref, payload)
    );

    alert('Repair job saved!');

    // Reset form
    this.model = {
      customerPhone: '',
      customerName: '',
      deviceName: '',
      issue: '',
      estimatedAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      status: 'pending',
      inDate: new Date(),
      completedAt: null
    };
  }

onPhoneChange(phone: string) {
  this.phoneInput$.next(phone);
}
ngOnInit() {
  this.phoneInput$
    .pipe(
      debounceTime(400),        // ✅ wait for user to stop typing
      distinctUntilChanged()    // ✅ ignore same value
    )
    .subscribe(phone => {
      this.fetchCustomerByPhone(phone);
    });
}

async fetchCustomerByPhone(phone: string) {
  if (!phone || phone.length < 5) {
    this.model.customerName = '';
    return;
  }

  const customersRef = collection(this.firestore, 'customers');
  const q = query(customersRef, where('phone', '==', phone));

  const snapshot = await this.fsLoader.wrapPromise(
      getDocs(q)
    );
  if (!snapshot.empty) {
    const customer = snapshot.docs[0].data() as any;
    this.model.customerName = customer.name || '';
  } else {
    this.model.customerName = '';
  }
}



}



