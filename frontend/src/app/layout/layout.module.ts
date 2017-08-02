import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { CalendarModule } from 'angular-calendar';
import { LayoutComponent } from './layout.component';
import { AuthGuard } from '../router-guard/auth.guard';
import { ToDoComponent } from './to-do/to-do.component';
import { CondorraRoutingModule } from './condorra-routing.module';
import { CalendarComponent } from './calendar/calendar.component';

@NgModule({
  imports: [
    CommonModule,
    CondorraRoutingModule,
    CalendarModule.forRoot(),
    FormsModule,
  ],
  declarations: [
    LayoutComponent,
    ToDoComponent,
    CalendarComponent,
  ],
  providers: [AuthGuard],
})
export class LayoutModule {}
