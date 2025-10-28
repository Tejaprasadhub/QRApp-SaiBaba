import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Firestore, collection, addDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';

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

    try {
  // 🔍 1️⃣ Check if phone exists
    const ref_check = collection(this.firestore, 'customers');
    const q = query(ref_check, where('phone', '==', phone));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      this.messageService.add({severity:'warn', summary:'Warning', detail:'Phone number already exists',sticky:false});
      setTimeout(() => {
              this.router.navigate(['/thank-you']);
      }, 2000);   
      return; // stop duplicate insert
    }

      const ref = collection(this.firestore, 'customers');
      addDoc(ref, customer);
      localStorage.setItem('customer', JSON.stringify(customer));
      this.messageService.add({severity:'success', summary:'Success', detail:'Thank you!! registered successfully',sticky:false});
      this.router.navigate(['/thank-you']);
    } catch (err) {
      this.messageService.add({severity:'error', summary:'Error', detail:'Failed to submit form',sticky:false});
      console.error('Failed to submit form:', err);
    }
  }
}
