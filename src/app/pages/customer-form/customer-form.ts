import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Firestore, collection, addDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';
  import { doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.html',
  styleUrls: ['./customer-form.scss'],
  standalone: false,
  providers: [MessageService]
})
export class CustomerForm implements OnInit {
  shopName = 'Sai Baba Cell Point';
  customerForm!: FormGroup;
 firestore = inject(Firestore); // ✅ modern inject() usage
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Initialize Reactive Form with validation
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });
  }

  // Convenience getters for template access
  get name() {
    return this.customerForm.get('name');
  }

  get phone() {
    return this.customerForm.get('phone');
  }


async submitForm() {
  if (this.customerForm.invalid) {
    this.customerForm.markAllAsTouched();
    return;
  }

  const customer = this.customerForm.value;
  customer.createdAt = new Date();

  const phone = customer.phone.trim();
  const phoneId = phone.replace(/\D/g, ''); // remove non-digit characters

  try {
    // 1️⃣ Use phone number as the document ID
    const docRef = doc(this.firestore, 'customers', phoneId);

    // 2️⃣ Try to create the document
    await setDoc(docRef, customer, { merge: false }); 
    // merge: false → ensures it's treated as a CREATE, not an update

    // 3️⃣ If successful, continue with post-submit actions
    localStorage.setItem('customer', JSON.stringify(customer));
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Thank you! Registered successfully',
      sticky: false
    });
    setTimeout(() => {
      this.router.navigate(['/thank-you']);
    }, 3000);
  } catch (err: any) {
    console.error('Failed to submit form:', err);

    // 4️⃣ Handle the "already exists" case
    if (err.code === 'permission-denied') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Phone number already exists',
        sticky: false
      });
      setTimeout(() => {
        this.router.navigate(['/thank-you']);
      }, 2000);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to submit form',
        sticky: false
      });
    }
  }
}

}
