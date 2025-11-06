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

const routes: Routes = [
 { path: '', redirectTo: '/customer-form', pathMatch: 'full' },
  { path: 'customer-form', component: CustomerForm },
  { path: 'qr-code', component: QrCodeComponent },
  { path: 'thank-you', component: ThankYou },
   { path: 'qr-redirect', component: QrRedirectComponent }, // 👈 new redirect route
{ path: 'customer-list', component: CustomerList ,
  canActivate: [AuthGuard]},
  {path:'login',component:AdminLogin},  

  //inventory management routes
  { path: 'products', component: ProductList },
  { path: 'categories', component: CategoryList },
  { path: 'sales', component: SalesList },
  { path: 'purchaseOrders', component: PurchaseOrders },
  { path: 'reorder', component: Reorder },
  {path:'dashboard',component:Dashboard},
  { path: 'subcategories', component: SubCategories },
  { path: 'products/add', component: ProductForm },
  { path: 'sales/add', component: SalesForm },

  // 👇 wildcard route must always come LAST
  { path: '**', redirectTo: '/customer-form' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{ useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
