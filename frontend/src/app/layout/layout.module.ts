// Import angular packages
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Import 3rd party libraries
import {
  DragulaModule,
  DragulaService,
} from 'ng2-dragula';
import { CalendarModule } from 'angular-calendar';

// Import our files
import { LayoutComponent } from './layout.component';
import { AuthGuard } from '../router-guard/auth.guard';
import { ToDoComponent } from './to-do/to-do.component';
import { LayoutRoutingModule } from './layout-routing.module';
import { LoadLearnService } from '../services/load-learn.service';
import { CalendarComponent } from './calendar/calendar.component';

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
    DragulaService,
    LoadLearnService,
  ],
})
export class LayoutModule {}
