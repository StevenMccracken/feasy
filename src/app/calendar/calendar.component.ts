import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {

  //simple test from api documentation
  viewDate: Date = new Date();
  events = [];

  constructor() { }

  ngOnInit() {
  }

}
