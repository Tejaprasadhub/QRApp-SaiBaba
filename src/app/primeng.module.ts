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
import { ChartModule } from 'primeng/chart';
import { DrawerModule } from 'primeng/drawer';

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
    TooltipModule,
    ChartModule,
    DrawerModule
  ]
})
export class PrimengModule {}
