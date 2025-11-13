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
import { PaginatorModule } from 'primeng/paginator'; // <-- import paginator module
import { AccordionModule } from 'primeng/accordion';

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
    DrawerModule,
    PaginatorModule,
    AccordionModule
  ]
})
export class PrimengModule {}
