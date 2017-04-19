import { NgModule }       from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { CalendarComponent } from '../calendar/calendar.component';
import { HealthbarComponent } from '../healthbar/healthbar.component';


const routes: Routes = [
  {path: '', redirectTo: '/calendar', pathMatch: 'full'},
  {path: 'calendar', component: CalendarComponent},
  {path: 'healthbar', component: HealthbarComponent}
];

@NgModule({
  imports:[
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule{ }
