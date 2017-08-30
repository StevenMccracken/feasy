import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DragulaModule, DragulaService } from 'ng2-dragula';

import { CalendarModule } from 'angular-calendar';
import { LayoutComponent } from './layout.component';
import { AuthGuard } from '../router-guard/auth.guard';
import { ToDoComponent } from './to-do/to-do.component';
import { LayoutRoutingModule } from './layout-routing.module';
import { CalendarComponent } from './calendar/calendar.component';

import { LoadLearnService } from '../services/load-learn.service';

@NgModule({
  imports: [
    FormsModule,
    CommonModule,
    DragulaModule,
    LayoutRoutingModule,
    CalendarModule.forRoot(),
  ],
  declarations: [
    ToDoComponent,
    LayoutComponent,
    CalendarComponent,
  ],
  providers: [
    AuthGuard,
    LoadLearnService,
    DragulaService,
  ],
})
export class LayoutModule {}
