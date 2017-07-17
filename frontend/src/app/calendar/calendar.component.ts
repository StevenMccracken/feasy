import { Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours
} from 'date-fns';
import { Subject } from 'rxjs/Subject';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent
} from 'angular-calendar';

import { Assignment } from '../objects/Assignment';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { AssignmentService } from '../services/assignment.service';

declare var $: any;


const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['calendar.component.css'],
  templateUrl: 'calendar.component.html'
})


export class CalendarComponent implements OnInit{

  assignment: Assignment = new Assignment();

  view: string = 'month';

  content: string;
  title: string;
  eventHold: CalendarEvent;

  test: string = '';

  viewDate: Date = new Date();
  eDescription: Map<CalendarEvent, Assignment> = new Map<CalendarEvent, Assignment>();
  events: CalendarEvent[]  = new Array<CalendarEvent>();

  constructor(private router: Router, private _assignmentService: AssignmentService){}

  ngOnInit(){
    $(document).ready(function() {
      $('select').material_select();
      $('select').on('change', function(e) {
          var selected = e.currentTarget.selectedOptions[0].value;
          localStorage['type'] = selected;
          $('select').prop('selectedIndex', 0); //Sets the first option as selected
      });
    });
    $('.datepicker').pickadate({
      onSet: (context) => {
         this.assignment.dueDate = new Date(context.select);},
         selectMonths: true, // Creates a dropdown to control month
         selectYears: 15 // Creates a dropdown of 15 years to control year
     });
    this.initializeCalendar();
  }

  modalData: {
    action: string,
    event: CalendarEvent,
  };

  actions: CalendarEventAction[] = [{
    label: '<i class="material-icons edit">create</i>',
    onClick: ({event}: {event: CalendarEvent}): void => {
      this.handleEvent('Edited', event);
      this.openModal("#createAssignments");
    }
  }, {
    label: '<i class="material-icons delete">delete_sweep</i>',
    onClick: ({event}: {event: CalendarEvent}): void => {
      this.handleEvent('Deleted', event);
      this._assignmentService.delete(this.eDescription.get(event)._id)
                             .then((res)=> console.log(res));
    }
  }];

  refresh: Subject<any> = new Subject();

  initializeCalendar(): void{
    let assignmentArray: Assignment[] = [];
    this._assignmentService.get()
                           .then((res: Assignment[]) => {
                             this.populate(res);
                           });

  }

  populate(assignmentArray: Assignment[]): void{
    console.log(assignmentArray);
    let SomeArray: CalendarEvent[] = [];
    for(let a of assignmentArray){
      let Event: CalendarEvent = { start: new Date(a.dateCreated),
                                   end: new Date(a.dueDate),
                                   title: a.title,
                                   color: (addDays(new Date(), 5) >  new Date(a.dueDate)) ? colors.red:
                                          (addDays(new Date(), 14) > new Date(a.dueDate)) ? colors.yellow:
                                          colors.blue,
                                   actions: this.actions,
                                   draggable: true};
      SomeArray.push(Event);
      this.eDescription.set(Event, a);
    }
    let variable: CalendarEvent[] = this.events.concat(SomeArray);
    this.events = variable;
    this.refresh.next();
  }

  //turn off active day
  activeDayIsOpen: boolean = false;


  dayClicked({date, events}: {date: Date, events: CalendarEvent[]}): void {

    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  eventTimesChanged({event, newStart, newEnd}: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.handleEvent('Dropped or resized', event);
    this.refresh.next();
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.content = this.eDescription.get(event).description;
    this.title = event.title;
    this.eventHold = event;
    if(action === 'Deleted')
      this.events = this.events.filter(iEvent => iEvent !== this.eventHold);
    else if(action === 'Edited')
      $('#editModal').modal('open');
    else
      $('#myModal').modal('open');
  }

  deleteEvent():void{
    this.events = this.events.filter(iEvent => iEvent !== this.eventHold);
  }

  saveEvent(): void{
    console.log(this.eventHold);
    this.eDescription.get(this.eventHold).description = this.content;
  }

  logout(): void{
    localStorage['currentUser'] = '';
    localStorage['token'] = '';
    this.router.navigate(['login']);
  }

  resetAssignmentField(): void{
    this.assignment = new Assignment();
    localStorage['type'] = '';

    //clear datepicker input field
    $('.datepicker').pickadate().pickadate('picker').clear();

    //clear select and reset to index 0
    $('select').material_select('destroy');
    $('select').material_select();
    $('select').prop('selectedIndex', 0); //Sets the first option as selected
  }

  addAssignment(): void{
    console.log(this.assignment);
    this.assignment.typeAssigned = (localStorage['type'] !== null || localStorage['type'] !== '') ? localStorage['type'] : '';
    this._assignmentService.create(this.assignment)
                           .then(() => {
                             console.log('something happened');
                             this.addEvent();
                             this.resetAssignmentField();
                           });
  }

  openModal(id: string): void{
    $(id).modal('open');
  }

  addEvent(): void {
    this.events.push({
      title: this.assignment.title,
      start: startOfDay(new Date()),
      end: endOfDay(new Date(this.assignment.dueDate)),
      color: (addDays(new Date(), 5) > this.assignment.dueDate) ? colors.red:
             (addDays(new Date(), 14) > this.assignment.dueDate) ? colors.yellow:
             colors.blue,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true
      },
      actions: this.actions
    });
    this.eDescription.set(this.events[this.events.length-1], this.assignment);
    this.refresh.next();
  }

}
