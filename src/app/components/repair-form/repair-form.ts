import { Component } from '@angular/core';
import { Firestore, collection, addDoc, query, where, collectionData, getDocs, serverTimestamp } from '@angular/fire/firestore';
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
  // async saveRepair() {
  //   const ref = collection(this.firestore, 'repairs');

  //   const payload = {
  //     ...this.model,
  //     inDate: new Date()
  //   };

  //   await this.fsLoader.wrapPromise(
  //     addDoc(ref, payload)
  //   );

  //   alert('Repair job saved!');

  //   // Reset form
  //   this.model = {
  //     customerPhone: '',
  //     customerName: '',
  //     deviceName: '',
  //     issue: '',
  //     estimatedAmount: 0,
  //     paidAmount: 0,
  //     pendingAmount: 0,
  //     status: 'pending',
  //     inDate: new Date(),
  //     completedAt: null
  //   };
  // }


  async saveRepair() {
  // Step 1: Check if the customer exists by phone number
  const customerRef = collection(this.firestore, 'customers');
  const q = query(customerRef, where('phone', '==', this.model.customerPhone));

  const snapshot = await this.fsLoader.wrapPromise(getDocs(q));

  if (snapshot.empty) {
    // Step 2: If customer doesn't exist, create a new customer
    await this.createNewCustomer();
  }

  // Step 3: Create the repair job after ensuring the customer exists
  const repairRef = collection(this.firestore, 'repairs');
  const repairPayload = {
    ...this.model,
    inDate: new Date(),
  };

  // Add repair job document to Firestore
  await this.fsLoader.wrapPromise(addDoc(repairRef, repairPayload));

  alert('Repair job saved!');

  // Reset the form after saving
  this.resetForm();
}

async createNewCustomer() {
  // Step 4: Create the new customer if not found
  const newCustomerPayload = {
    phone: this.model.customerPhone,
    name: this.model.customerName,  // Ensure the customer name is provided,
    createdAt: serverTimestamp()
  };
  // debugger;
  // Add customer document to Firestore
  await this.fsLoader.wrapPromise(addDoc(collection(this.firestore, 'customers'), newCustomerPayload));
  // debugger;
  // alert('New customer created!');
}

resetForm() {
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



