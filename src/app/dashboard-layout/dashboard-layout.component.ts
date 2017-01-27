import { Component, OnInit } from '@angular/core';
import { MenuItem }          from '../objects/menu-item';

import { CalendarComponent } from '../calendar/calendar.component';
import { HealthbarComponent } from '../healthbar/healthbar.component';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {
  user:string = "Sign-In";

  //this will be a service or a class that we can inject or import
  items:MenuItem[] = [
                      {icon:"fa fa-home fa-lg", menu:"Home"},
                      {icon:"fa fa-list fa-lg", menu:"To-Do List"},
                      {icon:"fa fa-file-word-o fa-lg", menu:"Work"},
                      {icon:"fa fa-rocket fa-lg", menu:"Widgets"}
                     ];

  constructor() { }

  ngOnInit() {
  }

}
