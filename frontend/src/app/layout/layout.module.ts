import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToDoComponent } from './to-do/to-do.component';
import { CondorraRoutingModule } from './condorra-routing.module';
import { FormsModule } from '@angular/forms';

import { CalendarComponent } from './calendar/calendar.component';
import { AuthGuard } from '../router-guard/auth.guard';
import { LayoutComponent } from './layout.component';
import { CalendarModule } from 'angular-calendar';

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
    CalendarComponent
  ],
  providers: [ AuthGuard ]
})
export class LayoutModule {}
