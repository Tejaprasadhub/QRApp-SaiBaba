import { Component } from '@angular/core';
import { Firestore, collection, addDoc, query, where, collectionData, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-repair-form',
  standalone: false,
  templateUrl: './repair-form.html',
  styleUrls: ['./repair-form.scss']
})
export class RepairForm {

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

  constructor(private firestore: Firestore) {}

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

    await addDoc(ref, payload);
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

  async onPhoneChange(phone: string) {
  if (!phone || phone.length < 5) {
    this.model.customerName = '';
    return;
  }

  const customersRef = collection(this.firestore, 'customers');
  const q = query(customersRef, where('phone', '==', phone));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const customer = snapshot.docs[0].data() as any;
    this.model.customerName = customer.name || '';
  } else {
    this.model.customerName = '';
  }
}


}



