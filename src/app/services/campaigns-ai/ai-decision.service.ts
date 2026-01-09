import { Injectable } from '@angular/core';
import { collection, collectionData, Firestore, query, where } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { CampaignRulesService } from './campaign-rules.service';
import { CampaignType } from '../../enums/campaign-type.enum';
import { AITag } from '../../enums/ai-tag.enum';
@Injectable({ providedIn: 'root' })
export class AIDecisionService {

  constructor(
    private firestore: Firestore,
    private rules: CampaignRulesService
  ) {}

  // 🔥 TOP PENDING PAYMENT CUSTOMERS
  getTopPendingCustomers(limit = 5) {
    const ref = collection(this.firestore, 'customers');
    const q = query(ref, where('pendingAmount', '>', 0));

    return collectionData(q, { idField: 'id' }).pipe(
      map((customers: any[]) =>
        customers
          .map(c => ({
            ...c,
            priorityScore: this.rules.computePendingPriority(
              c.pendingAmount,
              c.lastPaymentAt
            )
          }))
          .filter(c => this.rules.canSendCampaign(c.lastCampaignSentAt))
          .sort((a, b) => b.priorityScore - a.priorityScore)
          .slice(0, limit)
      )
    );
  }

  // 🔥 INACTIVE CUSTOMERS
  getInactiveCustomers(inactiveDays = 30) {
    const ref = collection(this.firestore, 'customers');

    return collectionData(ref, { idField: 'id' }).pipe(
      map((customers: any[]) =>
        customers.filter(c =>
          this.rules.isInactive(c.lastVisitAt, inactiveDays) &&
          this.rules.canSendCampaign(c.lastCampaignSentAt)
        )
      )
    );
  }
}
