import { NgModule, importProvidersFrom } from '@angular/core';
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

@NgModule({
  declarations: [
    App,
    CustomerForm,
    QrCodeComponent,
    ThankYou,
    QrRedirectComponent,
    CustomerList
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    FormsModule,

    PrimengModule
  ],
  providers: [
    // ✅ These go in providers, not imports
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore())
  ],
  bootstrap: [App]
})
export class AppModule { }
