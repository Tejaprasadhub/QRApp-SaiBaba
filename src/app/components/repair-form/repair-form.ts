import { Component } from '@angular/core';
import { Firestore, collection, addDoc, query, where, collectionData, getDocs, serverTimestamp } from '@angular/fire/firestore';
import { FirestoreLoaderService } from '../../services/firestore-loader.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { doc, updateDoc, increment } from '@angular/fire/firestore';
import { take } from 'rxjs';
import { Product, SalesProductService } from '../../services/sales-product-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-repair-form',
  standalone: false,
  templateUrl: './repair-form.html',
  styleUrls: ['./repair-form.scss']
})
export class RepairForm {
phoneInput$ = new Subject<string>();
spareParts: any[] = [];
existingCustomer = false;


partSearch = '';
searchedProducts: Product[] = [];

private partSearch$ = new Subject<void>();


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
    completedAt: null,
      repairType: 'repair' // default: 'repair', can be 'service'

  };

  constructor(private firestore: Firestore,
    private fsLoader: FirestoreLoaderService,
    private ps: SalesProductService,
    private router: Router
  ) {}

 addOutsideSpare() {
  this.spareParts.push({
   productId: null,
    name: '',
    qty: 1,
    source: 'outside',
    categoryName: '',
    subcategoryName: ''
  });
}


removePart(i: number) {
  this.spareParts.splice(i, 1);
}

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
  // =========================
  // 0️⃣ Validate form before saving
  // =========================
  // Phone must be 10 digits
  if (!this.model.customerPhone || this.model.customerPhone.length !== 10) {
    alert('Enter a valid 10-digit phone number!');
    return;
  }

  // Device name & issue required
  if (!this.model.deviceName || !this.model.issue) {
    alert('Device name and issue are required!');
    return;
  }

  // Estimated amount must be > 0
  if (!this.model.estimatedAmount || this.model.estimatedAmount <= 0) {
    alert('Estimated amount must be greater than 0!');
    return;
  }

  // Outside spare mandatory fields
  const invalidOutside = this.spareParts.some(
    p => p.source === 'outside' && (!p.name || !p.categoryName)
  );
  if (invalidOutside) {
    alert('Please fill all required fields for outside spare parts!');
    return;
  }


  // Spare parts validation only if type is 'repair'
if (this.model.repairType === 'repair') {
  if(this.spareParts.length === 0) {
    alert('Please add at least one spare part for repair jobs!');
    return;
  }
  for (const [index, part] of this.spareParts.entries()) {

    // Outside spare validation
    if (part.source === 'outside') {
      if (!part.name || !part.categoryName) {
        alert(`Please fill name & category for outside spare #${index + 1}`);
        return;
      }
      if (!part.qty || part.qty <= 0) {
        alert(`Quantity must be greater than 0 for outside spare #${index + 1}`);
        return;
      }
    }

    // Inventory spare validation
    if (part.source === 'inventory') {
      if (!part.qty || part.qty <= 0) {
        alert(`Quantity must be greater than 0 for inventory spare #${index + 1}`);
        return;
      }
    }
  }
}

  // =========================
  // 1️⃣ Check if customer exists
  // =========================
  const customerRef = collection(this.firestore, 'customers');
  const q = query(customerRef, where('phone', '==', this.model.customerPhone));
  const snapshot = await this.fsLoader.wrapPromise(getDocs(q));

  if (snapshot.empty) {
    // Create new customer if not exists
    await this.createNewCustomer();
  }

  // =========================
  // 2️⃣ Deduct inventory stock
  // =========================
  for (const part of this.spareParts) {
    if (part.source !== 'inventory' || !part.productId) continue;

    const productRef = doc(this.firestore, 'products', part.productId);
    await this.fsLoader.wrapPromise(
      updateDoc(productRef, {
        stock: increment(-part.qty)
      })
    );
  }

  // =========================
  // 3️⃣ Save repair job
  // =========================
  const repairRef = collection(this.firestore, 'repairs');
  await this.fsLoader.wrapPromise(
    addDoc(repairRef, {
      ...this.model,
      usedParts: this.spareParts,
      inDate: new Date()
    })
  );

  alert('Repair job saved successfully!');

  this.router.navigate(['/repairs-list']);
  // =========================
  // 4️⃣ Reset form
  // =========================
  this.resetForm();
}



async deductInventoryStock() {
  for (const part of this.spareParts) {
    if (part.source !== 'inventory' || !part.productId) continue;

    const productRef = doc(this.firestore, 'products', part.productId);
    if (part.qty <= 0) return;

    await this.fsLoader.wrapPromise(
      updateDoc(productRef, {
        stock: increment(-part.qty)
      })
    );
  }
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
    completedAt: null,
      repairType: 'repair' // default: 'repair', can be 'service'

  };

  // Add these lines
  this.spareParts = [];
  this.searchedProducts = [];
  this.partSearch = '';
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

    this.partSearch$
    .pipe(debounceTime(400))
    .subscribe(() => {
      this.searchSpareParts();
    });
}

onPartSearchChange() {
  this.partSearch$.next();
}

searchSpareParts() {
  if (!this.partSearch) {
    this.searchedProducts = [];
    return;
  }

      this.ps.getProducts({
        name: this.partSearch.toUpperCase(),
        pageSize: 10
      })
    
    .subscribe(res => {
      this.searchedProducts = res.data;
    });
}

addSpareFromInventory(product: Product) {
  const existing = this.spareParts.find(p => p.productId === product.id);
 if (existing) {
    if (existing.qty < (product.stock ?? 0)) {
      existing.qty++;
    } else {
      alert('Cannot add more than available stock!');
    }
    return;
  }

  this.spareParts.push({
    productId: product.id,
    name: product.name,
    qty: 1,
    source: 'inventory',
    categoryName: product.categoryName || 'Uncategorized',
    subcategoryName: product.subcategoryName || ''
  });

  this.partSearch = '';
  this.searchedProducts = [];
}

async fetchCustomerByPhone(phone: string) {
  if (!phone || phone.length !== 10) {  // <-- change here
    this.model.customerName = '';
    this.existingCustomer = false;
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
    this.existingCustomer = true;
  } else {
    this.model.customerName = '';
    this.existingCustomer = false;
  }
}



}



