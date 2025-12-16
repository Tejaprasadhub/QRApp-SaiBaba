import { Component, OnInit } from '@angular/core';
import { Firestore, collection, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AuthService } from '../../services/AuthService';
@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.scss'],
  standalone: false,
  providers: [MessageService]
})
export class CustomerList implements OnInit {
  page = 1;
pageSize = 5;
  customers: any[] = [];
selectedCustomer: any = { id: 0, name: '', phone: '' };
  displayDialog: boolean = false;
  constructor(private firestore: Firestore,private messageService :MessageService,private router: Router,
    private authService: AuthService
  ) {}
get totalPages(): number {
  return Math.ceil(this.customers.length / this.pageSize);
}

nextPage() {
  if (this.page < this.totalPages) {
    this.page++;
  }
}

prevPage() {
  if (this.page > 1) {
    this.page--;
  }
}

  async ngOnInit() {
    await this.getCustomers();
  }

 async getCustomers(){
const ref = collection(this.firestore, 'customers');

// 🔽 Order by 'createdAt' descending (newest first)
  const q = query(ref, orderBy('createdAt', 'desc')); // get last 10 records


    const snapshot = await getDocs(q);

    this.customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async updateCustomer(docId:any,customer?:any) {
    const customerId = docId;
    const customerRef = doc(this.firestore, `customers/${customerId}`);

    await updateDoc(customerRef, {
      name: customer?.name || 'Updated Name',
      phone: customer?.phone || '0000000000',
      status: 'Repaired'
    });
    this.messageService.add({severity:'success', summary:'Success', detail:'Customer updated successfully',sticky:false});
    await this.getCustomers();
  }

  async deleteCustomer(docId:any) {
    const customerId = docId;
    const customerRef =  doc(this.firestore, `customers/${customerId}`);

    await deleteDoc(customerRef);
    this.messageService.add({severity:'success', summary:'Success', detail:'Customer deleted successfully',sticky:false});
    await this.getCustomers();
  }

  addcustomer(){
     this.router.navigate(['/customer-form']);
  }

   async exportToExcel() {
    try {
      // 1️⃣ Fetch all customer docs
      const querySnapshot = await getDocs(collection(this.firestore, 'customers'));

      // 2️⃣ Convert to array
      const customers: any[] = [];
      querySnapshot.forEach(doc => {
        customers.push({ id: doc.id, ...doc.data() });
      });

      if (customers.length === 0) {
        this.messageService.add({severity:'warn', summary:'No Data', detail:'No customer data to export'});
        return;
      }

      // 3️⃣ Convert JSON to Excel worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(customers);

      // 4️⃣ Create a workbook and add the sheet
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');

      // 5️⃣ Generate Excel and download
      const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `Customers_${new Date().toISOString().split('T')[0]}.xlsx`);

      this.messageService.add({severity:'success', summary:'Success', detail:'Customer data exported successfully'});
    } catch (error) {
     this.messageService.add({severity:'error', summary:'Error', detail:'Failed to export customer data'});
      console.error('Error exporting customer data to Excel:', error);
    }
  }

  openEditDialog(customer: any) {
    this.selectedCustomer = { ...customer };
    this.displayDialog = true;
  }

  saveUpdatedCustomer() {
    const index = this.customers.findIndex(c => c.id === this.selectedCustomer.id);
    if (index !== -1) {
      this.customers[index] = { ...this.selectedCustomer };
    }
   this.updateCustomer(this.selectedCustomer.id,this.selectedCustomer);
    this.displayDialog = false;
  }

  async logout(){
      await this.authService.logout();
      this.messageService.add({severity:'success', summary:'Logged Out', detail:'You have been logged out successfully'});
   setTimeout(() => {
          this.router.navigate(['/login']);
   }, 3000);
  }
}
