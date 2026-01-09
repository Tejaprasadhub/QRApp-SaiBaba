import { Timestamp } from '@angular/fire/firestore';

export interface CustomerProfile {
  customerId: string;
  totalSalesAmount: number;
  totalPendingAmount: number;
  totalPaymentsDone: number;
  visitCount: number; // sales + repairs
  lastVisitAt?: Timestamp;
  lastPaymentAt?: Timestamp;
}
