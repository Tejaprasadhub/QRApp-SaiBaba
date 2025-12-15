import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerForm } from './pages/customer-form/customer-form';
import { QrCodeComponent } from './pages/qr-code/qr-code';
import { ThankYou } from './pages/thank-you/thank-you';
import { QrRedirectComponent } from './pages/qr-redirect/qr-redirect';
import { CustomerList } from './pages/customer-list/customer-list';
import { AuthGuard } from './services/AuthGuard';
import { AdminLogin } from './pages/admin-login/admin-login';

import { ProductList } from './components/product-list/product-list';
import { ProductForm } from './components/product-form/product-form';
import { CategoryList } from './components/category-list/category-list';
import { CategoryForm } from './components/category-form/category-form';
import { SalesList } from './components/sales-list/sales-list';
import { SalesForm } from './components/sales-form/sales-form';
import { Reorder } from './components/reorder/reorder';
import { Dashboard } from './components/dashboard/dashboard';
import { SubCategories } from './components/sub-categories/sub-categories';
import { PurchaseOrders } from './components/purchase-orders/purchase-orders';
import { CustomerHistory } from './components/customer-history/customer-history';
import { PendingPayments } from './components/pending-payments/pending-payments';
import { RepairsList } from './components/repairs-list/repairs-list';
import { RepairForm } from './components/repair-form/repair-form';

const routes: Routes = [
 { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'customer-form', component: CustomerForm },
  { path: 'qr-code', component: QrCodeComponent },
  { path: 'thank-you', component: ThankYou },
   { path: 'qr-redirect', component: QrRedirectComponent }, // 👈 new redirect route
{ path: 'customer-list', component: CustomerList ,
  canActivate: [AuthGuard]},
  {path:'login',component:AdminLogin},  

  //inventory management routes
  { path: 'products', component: ProductList,canActivate: [AuthGuard] },
  { path: 'categories', component: CategoryList,canActivate: [AuthGuard] },
  { path: 'sales', component: SalesList,canActivate: [AuthGuard] },
  { path: 'purchaseOrders', component: PurchaseOrders,canActivate: [AuthGuard] },
  { path: 'reorder', component: Reorder,canActivate: [AuthGuard] },
  {path:'dashboard',component:Dashboard,canActivate: [AuthGuard]},
  { path: 'subcategories', component: SubCategories,canActivate: [AuthGuard] },
  { path: 'products/add', component: ProductForm,canActivate: [AuthGuard] },
  { path: 'sales/add', component: SalesForm,canActivate: [AuthGuard] },
  { path: 'customer-history', component: CustomerHistory,canActivate: [AuthGuard] },
  { path: 'pending-payments', component: PendingPayments,canActivate: [AuthGuard] },
  { path: 'repairs-list', component: RepairsList,canActivate: [AuthGuard] },
  { path: 'repair-form', component: RepairForm,canActivate: [AuthGuard] },

  // 👇 wildcard route must always come LAST
  { path: '**', redirectTo: '/customer-form' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{ useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
