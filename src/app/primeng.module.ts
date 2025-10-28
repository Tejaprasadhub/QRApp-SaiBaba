import { NgModule } from '@angular/core';

// PrimeNG modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';

@NgModule({
  exports: [
    ButtonModule,
    InputTextModule,
    CardModule,
    TableModule,
    ToastModule,
    DialogModule,
    CheckboxModule,
    RadioButtonModule,
    MessageModule,
    TooltipModule
  ]
})
export class PrimengModule {}
