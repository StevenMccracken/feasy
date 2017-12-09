// Import angular packages
import {
  Router,
  Routes,
  RouterModule,
} from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import our files
import { LayoutComponent } from './layout.component';
import { HelpComponent } from './help/help.component';
import { AuthGuard } from '../router-guard/auth.guard';
import { ToDoComponent } from './to-do/to-do.component';
import { CalendarComponent } from './calendar/calendar.component';

const layoutRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: LayoutComponent,
    canActivateChild: [AuthGuard],
    children: [
      {
        path: '',
        children: [
          {
            path: 'todo',
            component: ToDoComponent,
          },
          {
            path: '',
            component: CalendarComponent,
          },
          {
            path: 'calendar',
            component: CalendarComponent,
          },
          {
            path: 'help',
            component: HelpComponent,
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(layoutRoutes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
