import { Timestamp } from '@angular/fire/firestore';
import { CustomerProfile } from './customer-profile.model';

export function buildCustomerProfile(
  customer: any,
  sales: any[],
  payments: any[],
  repairs: any[]
): CustomerProfile {
  const customerSales = sales.filter(s => s.customerId === customer.id);
  const customerPayments = payments.filter(p => p.customerId === customer.id);
  const customerRepairs = repairs.filter(r => r.customerPhone === customer.phone);

  const lastSaleDate = customerSales
    .map(s => s.date)
    .sort((a, b) => b.toMillis() - a.toMillis())[0];

  const lastRepairDate = customerRepairs
    .map(r => r.inDate)
    .sort((a, b) => b.toMillis() - a.toMillis())[0];

  const lastVisitAt = lastSaleDate && lastRepairDate
    ? (lastSaleDate.toMillis() > lastRepairDate.toMillis() ? lastSaleDate : lastRepairDate)
    : (lastSaleDate || lastRepairDate);

  return {
    customerId: customer.id,
    totalSalesAmount: customerSales.reduce((sum, s) => sum + s.total, 0),
    totalPendingAmount: customerSales.reduce((sum, s) => sum + (s.pendingAmount || 0), 0),
    totalPaymentsDone: customerPayments.reduce((sum, p) => sum + p.paidAmount, 0),
    visitCount: customerSales.length + customerRepairs.length,
    lastVisitAt,
    lastPaymentAt: customerPayments
      .map(p => p.createdAt)
      .sort((a, b) => b.toMillis() - a.toMillis())[0]
  };
}
