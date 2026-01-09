import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CampaignRulesService {

  daysBetween(date?: Timestamp): number {
    if (!date) return 999;
    const now = Date.now();
    const then = date.toMillis();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
  }

  computePendingPriority(pendingAmount: number, lastPaymentAt?: Timestamp): number {
    const daysPending = this.daysBetween(lastPaymentAt);
    return pendingAmount * daysPending;
  }

  isInactive(lastVisitAt?: Timestamp, inactiveDays = 30): boolean {
    return this.daysBetween(lastVisitAt) >= inactiveDays;
  }

  canSendCampaign(lastCampaignSentAt?: Timestamp, minGapDays = 7): boolean {
    return this.daysBetween(lastCampaignSentAt) >= minGapDays;
  }
}
