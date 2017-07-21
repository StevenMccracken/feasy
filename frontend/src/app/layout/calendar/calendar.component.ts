import { Subject } from 'rxjs/Subject';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
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
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent
} from 'angular-calendar';

import { Assignment } from '../../objects/Assignment';
import { AssignmentService } from '../../services/assignment.service';

declare var $: any;
declare var Materialize: any;

const colors = {
  gray: {
    primary: '#8c8c8c',
    secondary: '#bfbfbf',
  },
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF',
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA',
  },
};

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['calendar.component.css'],
  templateUrl: 'calendar.component.html',
})
export class CalendarComponent implements OnInit {
  // FIXME: Why is there a global assignment variable for the entire component?
  assignment: Assignment = new Assignment();
  view = 'month';
  currentDayArray: Assignment[];
  viewDate = new Date();

  eDescription = new Map<CalendarEvent, Assignment>();
  aDescription = new Map<Assignment, CalendarEvent>();
  events = new Array<CalendarEvent>();

  constructor(private router: Router, private _assignmentService: AssignmentService) {}

  ngOnInit() {
    $(document).ready(function() {
      $('select').material_select();
      $('select').on('change', function(e) {
          let selected = e.currentTarget.selectedOptions[0].value;
          localStorage['type'] = selected;
          $('select').prop('selectedIndex', 0); //Sets the first option as selected
      });
    });

    $('.datepicker').pickadate({
      onSet: (context) => { this.assignment.dueDate = new Date(context.select); },
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
    onClick: ({ event }: { event: CalendarEvent }): void => {
      this.handleEvent('Edited', event);
      this.openModal('#createAssignments');
    },
  },
  {
    label: '<i class="material-icons delete">delete_sweep</i>',
    onClick: ({ event }: { event: CalendarEvent }): void => {
      this.handleEvent('Deleted', event);

      // TODO: Add a catch for this service call
      this._assignmentService.delete(this.eDescription.get(event)._id)
        .then(response => console.log(response));
    },
  }];

  refresh = new Subject();

  deleteEventAction(assignment: Assignment, index: number): void {
    this.currentDayArray.splice(index, 1);
    console.log(assignment);
    console.log(index);
    let event: CalendarEvent = this.aDescription.get(assignment);
    this.events = this.events.filter(iEvent => iEvent !== event);

    // TODO: Add a catch for this service call
    this._assignmentService.delete(assignment._id)
      .then(response => console.log(response));
  }

  //////////////////////// INTIALIZE ITEM IN CALENDAR ////////////////////////////////////////////////
  initializeCalendar(): void {
    this._assignmentService.get()
      .then((assignments: Assignment[]) => this.populate(assignments));
  }

  populate(assignments: Assignment[]): void {
    console.log(assignments);
    let SomeArray: CalendarEvent[] = [];

    for (let a of assignments) {
      let Event: CalendarEvent = {
        start: new Date(a.dueDate),
        end: new Date(a.dueDate),
        title: a.title,
        // TODO: Clean up this monstrosity haha
        color: (new Date() > new Date(a.dueDate)) ? colors.gray :
        (addDays(new Date(), 5) >  new Date(a.dueDate)) ? colors.red:
        (addDays(new Date(), 14) > new Date(a.dueDate)) ? colors.yellow:
        colors.blue,
        actions: this.actions,
        draggable: true,
      };

      SomeArray.push(Event);
      this.eDescription.set(Event, a);
      this.aDescription.set(a, Event);
    }

    // Bad name
    let variable: CalendarEvent[] = this.events.concat(SomeArray);
    this.events = variable;
    this.refresh.next();
  }

  //////////////////////////////////////////////////////////////////////
  //turn off active day
  activeDayIsOpen = false;
  onetime = false;
  timer: any;

  enableEdit(assignment: Assignment, index: number): void {
    assignment.editMode = !assignment.editMode;
    let id = `#descriptionEdit${index}`;
    setTimeout(() => $(id).focus(), 1);
  }

  getEditMode(event: CalendarEvent): boolean {
    return this.eDescription.get(event).editMode;
  }

  monthEventClick(event: any) {
    this.onetime = !this.onetime;
    let eventArray: CalendarEvent[] = event.day.events;
    this.assignment.dueDate = new Date(event.day.date);

    this.currentDayArray = [];
    for(let a of eventArray) this.currentDayArray.push(this.eDescription.get(a));

    this.openView();
    console.log(event);
  }

  openView(): void {
    $('#viewEvent').modal('open');
  }

  eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.handleEvent('Dropped or resized', event);
    this.refresh.next();
  }

  updateDescription(assignment: Assignment): void {
    assignment.editMode = false;

    // TODO: Add a meaningful then and catch to this service call
    this._assignmentService.update(assignment._id, assignment.description);
  }

  dayEventClick(event: any): void {
    this.assignment.dueDate = event.date;
    this.openModal('#createAssignments');
  }

  resetAssignmentField(date: Date): void {
    this.assignment = new Assignment();
    this.assignment.dueDate = date;
    localStorage['type'] = '';

    //clear datepicker input field
    //$('.datepicker').pickadate().pickadate('picker').clear();

    //clear select and reset to index 0
    $('select').material_select('destroy');
    $('select').material_select();
    $('select').prop('selectedIndex', 0); //Sets the first option as selected
  }

  addAssignment(): void {
    this.assignment.completed = false;
    this.assignment.type = localStorage['type'];
    console.log(this.assignment.type);

    // TODO: Add catch to this service call
    this._assignmentService.create(this.assignment)
      .then((response) => {
        let assignmentResponse = response.json();
        console.log(assignmentResponse);

        this.assignment.type = assignmentResponse.type;
        this.assignment._id = assignmentResponse._id;
        console.log(this.assignment);

        this.currentDayArray.push(this.assignment);
        this.addEvent();
        this.resetAssignmentField(this.assignment.dueDate);
      });
  }

  addEvent(): void {
    this.events.push({
      title: this.assignment.title,
      start: startOfDay(new Date(this.assignment.dueDate)),
      end: endOfDay(new Date(this.assignment.dueDate)),
      color: (new Date() > this.assignment.dueDate) ? colors.gray:
             (addDays(new Date(), 5) > this.assignment.dueDate) ? colors.red:
             (addDays(new Date(), 14) > this.assignment.dueDate) ? colors.yellow:
             colors.blue,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      actions: this.actions,
    });

    this.eDescription.set(this.events[this.events.length - 1], this.assignment);
    this.aDescription.set(this.assignment, this.events[this.events.length - 1]);
    this.refresh.next();
  }

  //////////////////// HELPER FUNCTIONS /////////////////////
  openModal(id: string): void {
    $(id).modal('open');
  }

  getDescription(event: CalendarEvent): string {
    return this.eDescription.get(event).description;
  }

  //////////// NOT SURE IF NEEDED /////////////////////
  handleEvent(action: string, event: CalendarEvent): void {
    //nothing for now.
  }

  debug(event: any): void {
    console.log(event.target);
    let target = event.target;
    console.log(event.target.nodeName);
  }

  dayClicked({ date, events }: { date: Date, events: CalendarEvent[] }): void {
    console.log("not happeneing");
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) this.activeDayIsOpen = false;
      else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }
}
