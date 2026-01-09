import { AITag } from '../enums/ai-tag.enum';
import { CustomerProfile } from './customer-profile.model';

export function computeAITag(profile: CustomerProfile): AITag {

  // 🔴 CREDIT RISK: High pending & unpaid
  if (profile.totalPendingAmount >= 5000) {
    return AITag.CREDIT_RISK;
  }

  // 🟡 INACTIVE: No visit in long time
  if (!profile.lastVisitAt) {
    return AITag.INACTIVE;
  }

  // 🟢 LOYAL: Repeat customer, no pending
  if (profile.visitCount >= 3 && profile.totalPendingAmount === 0) {
    return AITag.LOYAL;
  }

  // 🔵 DEFAULT
  return AITag.LOW_RISK;
}
