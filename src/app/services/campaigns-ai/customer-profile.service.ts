import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buildCustomerProfile } from '../../utils/customer-profile.util';
import { computeAITag } from '../../utils/compute-ai-tag.util';

@Injectable({ providedIn: 'root' })
export class CustomerProfileService {

  constructor(private firestore: Firestore) {}

  getCustomerProfile$(customer: any): Observable<{
    profile: any;
    sales: any[];
    payments: any[];
    repairs: any[];
    aiTag: string;
  }> {

    const sales$ = collectionData(
      query(
        collection(this.firestore, 'sales'),
        where('customerId', '==', customer.id)
      ),
      { idField: 'id' }
    );

    const payments$ = collectionData(
      query(
        collection(this.firestore, 'payments'),
        where('customerId', '==', customer.id)
      ),
      { idField: 'id' }
    );

    const repairs$ = collectionData(
      query(
        collection(this.firestore, 'repairs'),
        where('customerPhone', '==', customer.phone)
      ),
      { idField: 'id' }
    );

    return combineLatest([sales$, payments$, repairs$]).pipe(
      map(([sales, payments, repairs]) => {
        const profile = buildCustomerProfile(
          customer,
          sales,
          payments,
          repairs
        );
        console.log('Customer Profile:', profile);
        const aiTag = computeAITag(profile);

        return {
          profile,
          sales,
          payments,
          repairs,
          aiTag
        };
      })
    );
  }
}
