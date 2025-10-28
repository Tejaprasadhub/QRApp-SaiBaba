import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerForm } from './pages/customer-form/customer-form';
import { QrCodeComponent } from './pages/qr-code/qr-code';
import { ThankYou } from './pages/thank-you/thank-you';
import { QrRedirectComponent } from './pages/qr-redirect/qr-redirect';
import { CustomerList } from './pages/customer-list/customer-list';

const routes: Routes = [
 { path: '', redirectTo: '/customer-form', pathMatch: 'full' },
  { path: 'customer-form', component: CustomerForm },
  { path: 'qr-code', component: QrCodeComponent },
  { path: 'thank-you', component: ThankYou },
   { path: 'qr-redirect', component: QrRedirectComponent }, // 👈 new redirect route
{ path: 'customer-list', component: CustomerList },

  // 👇 wildcard route must always come LAST
  { path: '**', redirectTo: '/customer-form' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes,{ useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
