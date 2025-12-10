import { NgModule, importProvidersFrom, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { CustomerForm } from './pages/customer-form/customer-form';
import { QrCodeComponent } from './pages/qr-code/qr-code';
import { ThankYou } from './pages/thank-you/thank-you';
import { PrimengModule } from './primeng.module';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore  } from '@angular/fire/firestore';

import { environment } from '../environments/environment';
import { QrRedirectComponent } from './pages/qr-redirect/qr-redirect';
import { CustomerList } from './pages/customer-list/customer-list';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { AdminLogin } from './pages/admin-login/admin-login';
import { Dashboard } from './components/dashboard/dashboard';
import { ProductList } from './components/product-list/product-list';
import { ProductForm } from './components/product-form/product-form';
import { CategoryList } from './components/category-list/category-list';
import { CategoryForm } from './components/category-form/category-form';
import { SalesList } from './components/sales-list/sales-list';
import { SalesForm } from './components/sales-form/sales-form';
import { Reorder } from './components/reorder/reorder';
import { SubCategories } from './components/sub-categories/sub-categories';
import { PurchaseOrders } from './components/purchase-orders/purchase-orders';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { LoaderInterceptor } from './services/loader.interceptor';
import { CustomerHistory } from './components/customer-history/customer-history';
import { PendingPayments } from './components/pending-payments/pending-payments';
import { RepairForm } from './components/repair-form/repair-form';
import { RepairsList } from './components/repairs-list/repairs-list';
import { SplitChipsPipe } from './pipes/split-chips.pipe';
import { ChipMatchPipe } from './pipes/chip-match.pipe';
import { ServiceWorkerModule } from '@angular/service-worker';
@NgModule({
  declarations: [
    SplitChipsPipe,
    ChipMatchPipe,
    App,

    CustomerForm,
    QrCodeComponent,
    ThankYou,
    QrRedirectComponent,
    CustomerList,
    AdminLogin,
    Dashboard,
    ProductList,
    ProductForm,
    CategoryList,
    CategoryForm,
    SalesList,
    SalesForm,
    Reorder,
    SubCategories,
    PurchaseOrders,
    CustomerHistory,
    PendingPayments,
    RepairsList,
    RepairForm
  ],
  imports: [
    BrowserModule,
ReactiveFormsModule,
AppRoutingModule,
BrowserAnimationsModule,
FormsModule,
    HttpClientModule,

PrimengModule,
  ServiceWorkerModule.register('ngsw-worker.js', {
    enabled: !isDevMode(),
    // Register the ServiceWorker as soon as the application is stable
    // or after 30 seconds (whichever comes first).
    registrationStrategy: 'registerWhenStable:30000'
  })
  ],
  providers: [
    // ✅ These go in providers, not imports
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }
  ],
  bootstrap: [App]
})
export class AppModule { }
