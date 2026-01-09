import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  addDoc,
  serverTimestamp
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private collectionName = 'customers';

  constructor(private firestore: Firestore) {}

  

  /* ----------------------------------------
   * GET CUSTOMER BY PHONE (IMPORTANT)
   * -------------------------------------- */

  async getCustomerByPhone(phone: string): Promise<any | null> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('phone', '==', phone)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }

   /* ----------------------------------------
   * UPDATE CUSTOMER (GENERIC)
   * -------------------------------------- */

  updateCustomer(customerId: string, data: Partial<any>) {
    const ref = doc(this.firestore, this.collectionName, customerId);
    return updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  

  
}
