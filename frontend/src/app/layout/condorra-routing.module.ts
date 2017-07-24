import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, Routes, RouterModule } from '@angular/router';

import { CalendarComponent } from './calendar/calendar.component';
import { LayoutComponent } from './layout.component';
import { AuthGuard } from '../router-guard/auth.guard';
import { ToDoComponent } from './to-do/to-do.component';


const layoutRoutes: Routes =[
  {
  path: '',
  component: LayoutComponent,
  canActivate: [AuthGuard],
  canActivateChild: [AuthGuard],
  children: [
    {
      path: '',
      children: [
        { path: 'todo', component: ToDoComponent },
        { path: '', component: CalendarComponent },
        { path: 'calendar', component: CalendarComponent }
      ]
    }
  ]
}
];

@NgModule({
  imports: [RouterModule.forChild(layoutRoutes)],
  exports: [RouterModule]
})

export class CondorraRoutingModule { }
