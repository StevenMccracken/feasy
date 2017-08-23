import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { CalendarModule } from 'angular-calendar';
import { LayoutComponent } from './layout.component';
import { AuthGuard } from '../router-guard/auth.guard';
import { ToDoComponent } from './to-do/to-do.component';
import { LayoutRoutingModule } from './layout-routing.module';
import { CalendarComponent } from './calendar/calendar.component';

import { DragulaModule } from 'ng2-dragula';
import { DragulaService } from 'ng2-dragula';


@NgModule({
  imports: [
    CommonModule,
    LayoutRoutingModule,
    CalendarModule.forRoot(),
    FormsModule,
    DragulaModule
  ],
  declarations: [
    LayoutComponent,
    ToDoComponent,
    CalendarComponent,
  ],
  providers: [AuthGuard, DragulaService],
})
export class LayoutModule {}
