import { Subject } from 'rxjs/Subject';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
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
import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';

import { Assignment } from '../../objects/assignment';
import { AssignmentService } from '../../services/assignment.service';

// Used to access jQuery and Materialize script
declare var $: any;
declare var Materialize: any;

// Define colors for events
const COLORS = {
  GRAY: {
    primary: '#8C8C8C',
    secondary: '#BFBFBF',
  },
  RED: {
    primary: '#AD2121',
    secondary: '#FAE3E3',
  },
  BLUE: {
    primary: '#1E90FF',
    secondary: '#D1E8FF',
  },
  YELLOW: {
    primary: '#E3BC08',
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
  // assignment object used for the assignment form
  assignment = new Assignment();

  // set the default calendar view to month
  view = 'month';

  // this stores the assignments for the current day picked
  currentDayArray: Assignment[];

  // this allows the calendar to tell which date you are on
  viewDate = new Date();

  // IMPORTANT! USE THIS TO STORE TARGET INTO A VARIABLE TODO: Clarify this comment
  e: any;

  catagorySelect = false;

  // USE THIS HASHMAP TO STORE A REFERENCE FOR TASK -> EVENTS, & EVENTS -> TASK
  eDescription = new Map<CalendarEvent, Assignment>();
  aDescription = new Map<Assignment, CalendarEvent>();

  // array to store all the calendar events
  events: CalendarEvent[] = new Array<CalendarEvent>();

  activeDayIsOpen = false;
  onetime = false;
  timer: any;

  refresh: Subject<any> = new Subject();

  modalData: {
    action: string,
    event: CalendarEvent,
  };

  actions: CalendarEventAction[] = [
    {
      label: '<i class="material-icons edit">create</i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edited', event);
        this.openModal('#createAssignments');
      },
    },
    {
      label: '<i class="material-icons delete">delete_sweep</i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        let assignment = this.eDescription.get(event);
        this._assignmentService.delete(assignment._id)
          .then(() => {
            for (let i = 0; i < this.currentDayArray.length; i++) {
              if (this.currentDayArray[i] == assignment) {
                this.currentDayArray.splice(i, 1);
                break;
              }
            }

            // Remove the event linked to the assignment
            this.events = this.events.filter(iEvent => iEvent !== event);
            this.handleEvent('Deleted', event);
          })
          .catch((deleteError: Response) => {
            if (deleteError.status === 404) this.handle404Error(assignment);
            else this.handleError(deleteError);
          });
      },
    }
  ];

  constructor(private _router: Router, private _assignmentService: AssignmentService) {}

  ngOnInit() {
    $(document).ready(function() {
      $('#select').material_select();
      $('#select').on('change', function(e) {
          let selected = e.currentTarget.selectedOptions[0].value;
          localStorage.setItem('type', selected);
          $('#select').prop('selectedIndex', 0); // Sets the first option as selected
      });
    });

    $('#viewEdit').modal({
      dismissible: false,
      ready: () => console.log('open modal'),
    });

    $('.datepicker').pickadate({
      onSet: (context) => this.assignment.dueDate = new Date(context.select),
      selectMonths: true, // Creates a dropdown to control month
      selectYears: 15, // Creates a dropdown of 15 years to control year
    });

    this.assignment.type = '';

    // Populate the calendar with the user's assignments
    this.initializeCalendar();
  }

  // STORES THE TARGET
  setEvent(event: any): void {
    this.e = $(event.target).hasClass('cal-cell-top') ? event.target : null;
  }

  /**
   * Deletes an assignment by calling the API
   * and then removes it from local memory
   * @param {Assignment} assignment the assignment to delete
   * @param {number} index the position of the assignment in the current day array
   */
  deleteEventAction(assignment: Assignment, index: number): void {
    this._assignmentService.delete(assignment._id)
      .then(() => {
        // Remove the assignment from the events
        this.currentDayArray.splice(index, 1);
        let event: CalendarEvent = this.aDescription.get(assignment);
        this.events = this.events.filter(iEvent => iEvent !== event);

        // Update the UI
        this.refresh.next();
      })
      .catch((deleteError: Response) => {
        if (deleteError.status === 404) this.handle404Error(assignment);
        else this.handleError(deleteError);
      });
  }

  /**
   * Gets all the assignments from the API for
   * the user and add populates the calendar
   */
  initializeCalendar(): void {
    this._assignmentService.getAll()
      .then((assignments: Assignment[]) => this.populate(assignments))
      .catch((getAssignmentsError: Response) => this.handleError(getAssignmentsError));
  }

  /**
   * Determines the color for a given date based on it's relation
   * to the current date, usually an assignment's due date
   * @param {Date} dueDate the date to determine the color for
   * @return {any} JSON of the color attributes
   */
  determineColor(dueDate: Date): any {
    let color;
    let now = new Date();

    /**
     * Gray: Events that were before the current date
     * Red: Events that are within 5 days of the current date
     * Yellow: Events that are more than 5 days away but less than 14 days from the current date
     * Blue: Events that are more than 14 days away from the current date
     */
    if (endOfDay(dueDate) < now) color = COLORS.GRAY;
    else if (
      dueDate >= startOfDay(now) &&
      endOfDay(dueDate) < startOfDay(addDays(now, 5))
    ) color = COLORS.RED;
    else if (
      dueDate >= startOfDay(addDays(now, 5)) &&
      endOfDay(dueDate) < startOfDay(addDays(now, 14))
    ) color = COLORS.YELLOW;
    else color = COLORS.BLUE;

    return color;
  }

  /**
   * Adds the given assignments to the calendar's events
   * @param {Assignment[]} assignments the list of assignments to add to the calendar
   */
  populate(assignments: Assignment[]): void {
    let cEvents: CalendarEvent[] = [];

    for (let assignment of assignments) {
      // Create a CalendarEvent for each assignment
      let event: CalendarEvent = {
        start: assignment.dueDate,
        end: assignment.dueDate,
        title: assignment.title,
        color: this.determineColor(assignment.dueDate),
        actions: this.actions,
        draggable: true,
      };

      // Add the event to the list of events
      cEvents.push(event);

      // Add the assignment and event to the maps
      this.eDescription.set(event, assignment);
      this.aDescription.set(assignment, event);
    }

    // Update the global events with the events that were just created
    this.events = this.events.concat(cEvents);
    this.refresh.next();
  }

  enableEdit(assignment: Assignment, index: number): void {
    assignment.editMode = !assignment.editMode;
    let id = `#descriptionEdit${index}`;
    setTimeout(() => $(id).focus(), 1);
  }

  getEditMode(event: CalendarEvent): boolean {
    // TODO: Add a check for null/undefined returned from the map
    return this.eDescription.get(event).editMode;
  }

  monthEventClick(event: any) {
    this.onetime = !this.onetime;
    if (this.onetime) {
      let eventArray: CalendarEvent[] = event.day.events;
      this.assignment.dueDate = new Date(event.day.date);
      this.currentDayArray = [];

      for (let a of eventArray) this.currentDayArray.push(this.eDescription.get(a));

      if (this.currentDayArray.length != 0) {
        this.timer = setTimeout(() => {
          this.displayPopUp();
          this.onetime = !this.onetime;
        }, 200);
      } else {
        this.onetime = !this.onetime;
        this.openView(event.day.date);
      }
    } else {
      clearTimeout(this.timer);

      // FIXME: Nothing is done with this array?
      let eventArray: CalendarEvent[] = event.day.events;
      this.openView(event.day.date);
    }
  }

  displayPopUp(): void {
    if (this.e !== null && this.e !== undefined) {
      if ($(this.e).is('#popup')) {
        $(this.e).children('.show').css('display', 'inline-block');
        let prev_e = this.e;
        setTimeout(() => $(prev_e).children('.show').css('display', 'none'), 3000);
      } else {
        $(this.e).attr('id', 'popup');
        let data = `<div id='popup' class='popuptext show'>`;
        for(let a of  this.currentDayArray) data += `${a.title}<br>`;
        data += '</div>';

        $(this.e).addClass('popup');
        this.e.insertAdjacentHTML('afterbegin', data);
        let prev_e = this.e;

        setTimeout(() => $(prev_e).children('.show').css('display', 'none'), 3000);
      }
    }
  }

  openView(dueDate: Date): void {
    this.assignment = new Assignment();
    this.assignment.completed = false;
    this.assignment.type = '';
    this.assignment.dueDate = dueDate;
    $('#viewEvent').modal('open');
  }

  resetField(): void {
    console.log('done');
  }

  /**
   * Updates an assignment's due date by calling the API
   * @param {CalendarEventTimesChangedEvent} { event, newStart,
   * newEnd } the JSON containing the new event information
   */
  eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    let assignment = this.eDescription.get(event);
    this._assignmentService.updateDueDate(assignment._id, newEnd)
      .then(() => {
        event.start = newEnd;
        event.end = newEnd;
        event.color = this.determineColor(newEnd);
        this.refresh.next();
      })
      .catch((updateError: any) => {
        if (typeof updateError === 'string') this.handleUpdateError('due date', updateError);
        else if (updateError.status === 404) this.handle404Error(assignment);
        else this.handleError(updateError);
      });
  }

  /**
   * Updates an assignments description by calling the API
   * @param {Assignment} assignment the updated assignment
   */
  updateDescription(assignment: Assignment): void {
    assignment.editMode = false;
    this._assignmentService.updateDescription(assignment._id, assignment.description)
      .then()
      .catch((updateError: any) => {
        if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
        else if (updateError.status === 404) this.handle404Error(assignment);
        else this.handleError(updateError);
      });
  }

  test(): void {
    this.catagorySelect = true;
    console.log(this.catagorySelect);
  }

  dayEventClick(event: any): void {
    this.assignment.dueDate = event.date;
    this.openModal('#createAssignments');
  }

  resetAssignmentField(date: Date): void {
    this.assignment = new Assignment();
    this.assignment.type = '';
    this.assignment.dueDate = date;
  }

  addAssignment(): void {
    this.assignment.completed = false;
    this._assignmentService.create(this.assignment)
      .then((newAssignment: Assignment) => {
        this.assignment = newAssignment;
        this.currentDayArray.push(this.assignment);
        this.addEvent();
        this.resetAssignmentField(this.assignment.dueDate);
      })
      .catch((createError: any) => {
        if (Array.isArray(createError)) {
          // Request was invalid and createError is an array containing invalid params
          console.error('Invalid parameters: %s', createError.join());
        } else this.handleError(createError);

        // TODO: Close the modal and grayed background
      });
  }

  addEvent(): void {
    this.events.push({
      title: this.assignment.title,
      start: startOfDay(this.assignment.dueDate),
      end: endOfDay(this.assignment.dueDate),
      color: this.determineColor(this.assignment.dueDate),
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

  openModal(id: string): void {
    $(id).modal('open');
  }

  getDescription(event: CalendarEvent): string {
    return this.eDescription.get(event).description;
  }

  handleEvent(action: string, event: CalendarEvent): void {}

  debug(event: any): void {
    console.log(event);
    console.log(event.target);
  }

  dayClicked({ date, events }: { date: Date, events: CalendarEvent[] }): void {
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

  private handleError(error: Response): void {
    if (error.status == 401) {
      // Token is stale. Clear the user and token local storage, route them to login screen
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');

      // Add the reason for re-routing to login
      localStorage.setItem('expiredToken', 'true');

      // Route to the login page
      this._router.navigate(['/login']);
    } else {
      // API error, server could be down/crashed
      console.error(error);
    }
  }

  private handle404Error(assignment: Assignment): void {
    // Find the assignment in the current day array
    for (let i = 0; i < this.currentDayArray.length; i++) {
      if (this.currentDayArray[i] == assignment) {
        this.currentDayArray.splice(i, 1);
        break;
      }
    }

    // Remove the event linked to the assignment
    let event: CalendarEvent = this.aDescription.get(assignment);
    this.events = this.events.filter(iEvent => iEvent !== event);
  }

  private handleUpdateError(attribute: string, reason: string): void {
    switch (reason) {
      case 'invalid':
        console.error('New %s was malformed', attribute);
        break;
      case 'unchanged':
        console.error('New %s was unchanged', attribute);
        break;
      default:
        console.error('New %s was invalid in some way', attribute);
    }
  }

  /**
   * Determines if a specific local storage item contains any meaningful data
   * @param {string} storageItemKey the key of the local storage item
   * @return {boolean} whether or not the key contains a meaningful (non-empty) data value
   */
  isValidStorageItem(storageItemKey: string): boolean {
    let storageItem = localStorage.getItem(storageItemKey);
    return storageItem != null && storageItem != undefined && storageItem != '';
  }
}
