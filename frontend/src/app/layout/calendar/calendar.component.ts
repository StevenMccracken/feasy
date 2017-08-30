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
import { Component, ChangeDetectionStrategy, OnInit, Input} from '@angular/core';

import { COLORS } from '../../objects/colors';
import { Assignment } from '../../objects/assignment';
import { AssignmentService } from '../../services/assignment.service';
import { CommonUtilsService } from '../../utils/common-utils.service';
import { LocalStorageService } from '../../utils/local-storage.service';

import { LayoutComponent } from '../layout.component';

import { LoadLearnService } from '../../services/load-learn.service';
// Used to access jQuery and Materialize script
declare var $: any;
declare var Materialize: any;

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['calendar.component.css'],
  templateUrl: 'calendar.component.html',
})

export class CalendarComponent implements OnInit {

  // Assignment object used for the assignment form
  assignment: Assignment = new Assignment();
  jquery: any;

  // set the default calendar view to month
  view: string = 'month';

  // this stores the assignments for the current day picked
  currentDayArray: Assignment[];

  // this allows the calendar to tell which date you are on
  viewDate: Date = new Date();

  // IMPORTANT! USE THIS TO STORE TARGET INTO A VARIABLE TODO: Clarify this comment
  e: any;

  catagorySelect: boolean = false;

  // USE THIS HASHMAP TO STORE A REFERENCE FOR TASK -> EVENTS, & EVENTS -> TASK
  eDescription: Map<CalendarEvent, Assignment> = new Map<CalendarEvent, Assignment>();
  aDescription: Map<Assignment, CalendarEvent> = new Map<Assignment, CalendarEvent>();

  // array to store all the calendar events
  events: CalendarEvent[] = new Array<CalendarEvent>();

  activeDayIsOpen: boolean = false;
  onetime: boolean = false;
  timer: any;

  // quicksettings
  formDescription: boolean;
  formLabel: boolean;


  refresh: Subject<any> = new Subject();

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
  }];

  constructor(
    private _router: Router,
    private _utils: CommonUtilsService,
    private _storage: LocalStorageService,
    private _assignmentService: AssignmentService,
    private _loadLearn: LoadLearnService
  ) {}

  // TODO: This isn't used right now
  public refreshCalendar = () => {
    this.refresh.next();
  };

  ngOnInit() {

    //this is not really the best way but it might work for now
    setInterval( () => {
      if(localStorage['changed'] === 'true'){
        let temp = this._loadLearn.getTaskArray();
        this.populateAfter(temp);
        localStorage['changed'] = 'false';
        console.log('hello');
      }
      console.log(localStorage['changed']);

    }, 200);

    $('#viewEvent').modal({
      dismissible: true,
      ready: () => console.log('open modal'),
      complete: function() {
        console.log('this hit');
        this.initializeCalendar();
      },
    });

    let storage: LocalStorageService = this._storage;
    $(document).ready(function() {
      $('#select').material_select();
      $('#select').on('change', function(e) {
        let selected = e.currentTarget.selectedOptions[0].value;
        storage.setItem('type', selected);
        $('#select').prop('selectedIndex', 0); // Sets the first option as selected
      });
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
  setEvent(_event: any): void {
    this.e = $(_event.target).hasClass('cal-cell-top') ? _event.target : null;
  }

  /**
   * Deletes an assignment by calling the API
   * and then removes it from local memory
   * @param {Assignment} _assignment the assignment to delete
   * @param {number} _index the position of the assignment in the current day array
   */
  deleteEventAction(_assignment: Assignment, _index: number): void {
    this._assignmentService.delete(_assignment._id)
      .then(() => {
        // Remove the assignment from the events
        this.currentDayArray.splice(_index, 1);
        let event: CalendarEvent = this.aDescription.get(_assignment);
        this.events = this.events.filter(iEvent => iEvent !== event);

        // Update the UI
        this.refresh.next();
      })
      .catch((deleteError: Response) => {
        if (deleteError.status === 404) this.handle404Error(_assignment);
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

  updateCompleted(a: Assignment){
    this._assignmentService.updateCompleted(a._id, !a.completed)
                           .then(() => {
                             console.log('completed updated');
                             a.completed = !a.completed;
                             this.changeColor(a);
                           })
                           .catch((getAssignmentsError: Response) => this.handleError(getAssignmentsError));
  }

  changeColor(a: Assignment){
    let newEvent = this.aDescription.get(a);
    newEvent.color = this.determineColor(a);
    this.events.splice(this.events.indexOf(this.aDescription.get(a)), 1);
    this.events.push(newEvent);
    this.refresh.next();
  }
  /**
   * Determines the color for a given assignment's
   * date based on it's relation to the current date
   * @param {Assignment} _assignment the assignment to determine the color for
   * @return {any} JSON of the color attributes
   */
  determineColor(_assignment: Assignment): any {
    let color;
    let now = new Date();
    let dueDate = _assignment.dueDate;

    /**
     * Gray: Events that were before the current date
     * Red: Events that are within 5 days of the current date
     * Yellow: Events that are more than 5 days away but less than 14 days from the current date
     * Blue: Events that are more than 14 days away from the current date
     */
    if (_assignment.completed) color = COLORS.GREEN;
    else if (endOfDay(dueDate) < now) color = COLORS.GRAY;
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

  populateAfter(_assignments: Assignment[]): void{
    let cEvents: CalendarEvent[] = [];
    for (let assignment of _assignments) {
      // Create a CalendarEvent for each assignment
      let event: CalendarEvent = {
        start: assignment.dueDate,
        end: assignment.dueDate,
        title: assignment.title,
        color: this.determineColor(assignment),
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
  /**
   * Adds the given assignments to the calendar's events
   * @param {Assignment[]} _assignments the list of assignments to add to the calendar
   */
  populate(_assignments: Assignment[]): void {
    this.events = [];
    let cEvents: CalendarEvent[] = [];

    for (let assignment of _assignments) {
      // Create a CalendarEvent for each assignment
      let event: CalendarEvent = {
        start: assignment.dueDate,
        end: assignment.dueDate,
        title: assignment.title,
        color: this.determineColor(assignment),
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

  // TODO: Add formal documentation
  enableEdit(_assignment: Assignment, _index: number, type: string): void {
    let id;
    switch (type) {
      case 'title':
        _assignment.editModeTitle = !_assignment.editModeTitle;
        id = `#titleEdit${_index}`;
        setTimeout(() => $(id).focus(), 1);
        break;
      case 'description':
        _assignment.editModeDescription = !_assignment.editModeDescription;
        id = `#descriptionEdit${_index}`;
        setTimeout(() => $(id).focus(), 1);
        break;
      case 'all':
        _assignment.editModeTitle = true;
        _assignment.editModeDescription = true;
        _assignment.editModeDate = true;

        id = `#titleEdit${_index}`;
        setTimeout(() => $(id).focus(), 1);

        let $input = $(`#datetime${_index}`).pickadate();
        let picker = $input.pickadate('picker');
        picker.set('select', _assignment.dueDate);
        break;
      default:
    }
  }

  // TODO: Add formal documentation
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
        }, 300);
      } else {
        this.onetime = !this.onetime;
        this.openView(event.day.date);
      }
    } else {
      clearTimeout(this.timer);

      for (let a of this.currentDayArray){
        a.editModeDate = false;
        a.editModeDescription = false;
        a.editModeTitle = false;
      }

      this.openView(event.day.date);
    }
  }

  // TODO: Add formal documentation
  displayPopUp(): void {
    if (this._utils.hasValue(this.e)) {
      if ($(this.e).is('#popup')) {
        $(this.e).children('.show').css('display', 'inline-block');
        let prev_e = this.e;
        setTimeout(() => $(prev_e).children('.show').css('display', 'none'), 3000);
      } else {
        $(this.e).attr('id', 'popup');
        let data = `<div id='popup' class='popuptext show'>`;
        for (let a of  this.currentDayArray) data += `${a.title}<br>`;
        data += '</div>';

        $(this.e).addClass('popup');
        this.e.insertAdjacentHTML('afterbegin', data);
        let prev_e = this.e;

        setTimeout(() => $(prev_e).children('.show').css('display', 'none'), 3000);
      }
    }
  }

  // TODO: Add formal documentation
  openView(_dueDate: Date): void {
    this.assignment = new Assignment();
    this.assignment.completed = false;
    this.assignment.type = '';
    this.assignment.dueDate = _dueDate;

    if (this._storage.isValidItem('qsDescription')) {
      this.formDescription = this._storage.getItem('qsDescription') === 'true';
    }

    if (this._storage.isValidItem('qsLabel')) {
      this.formLabel = this._storage.getItem('qsLabel') === 'true';
    }

    $('#viewEvent').modal('open');
  }

  // TODO: Is this necessary?
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
        event.color = this.determineColor(assignment);
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
   * @param {Assignment} _assignment the updated assignment
   */
  updateDescription(_assignment: Assignment): void {
    _assignment.editModeDescription = false;
    this._assignmentService.updateDescription(_assignment._id, _assignment.description)
      .then()
      .catch((updateError: any) => {
        if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
        else if (updateError.status === 404) this.handle404Error(_assignment);
        else this.handleError(updateError);
      });
  }

  /**
   * Update an assignment title by calling the API
   * @param {Assignment} _assignment the updated assignment
   */
  updateTitle(_assignment: Assignment): void {
    _assignment.editModeTitle = false;
    this._assignmentService.updateTitle(_assignment._id, _assignment.title)
      .then()
      .catch((updateError: any) => {
        if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
        else if (updateError.status === 404) this.handle404Error(_assignment);
        else this.handleError(updateError);
      });
  }

  /**
   * Update an assignment's title by calling the API
   * @param {Assigment} _assignment the update assignment
   * @param {number} _index the index of the assignment in the assignments array // TODO: Verify this comment
   */
  updateTask(_assignment: Assignment, _index: number): void {
    let id = _assignment._id;
    _assignment.editModeTitle = false;
    _assignment.editModeDescription = false;
    _assignment.editModeDate = false;
    this._assignmentService.updateTitle(id, _assignment.title)
      .then(() => console.log('Updated title'))
      .catch((updateError: any) => {
        if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
        else if (updateError.status === 404) this.handle404Error(_assignment);
        else this.handleError(updateError);
      });

    if ($(`#datetime${_index}`)[0].value !== '') {
      let newDueDate = new Date($(`#datetime${_index}`)[0].value);
      this._assignmentService.updateDueDate(id, newDueDate)
        .then(() => {
          console.log('Updated Due Date');
          if (_assignment.dueDate !== newDueDate) {
            console.log('spliced');
            _assignment.dueDate = newDueDate;
            this.currentDayArray.splice(_index, 1);

            // TODO: implement a better way to update events array.
            this.initializeCalendar();
          }
        })
        .catch((updateError: any) => {
          if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
          else if (updateError.status === 404) this.handle404Error(_assignment);
          else this.handleError(updateError);
        });
      }

    this._assignmentService.updateDescription(id, _assignment.title)
      .then(() => console.log('Updated description'))
      .catch((updateError: any) => {
        if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
        else if (updateError.status === 404) this.handle404Error(_assignment);
        else this.handleError(updateError);
      });
  }

  test(): void {
    this.catagorySelect = true;
    console.log(this.catagorySelect);
  }

  dayEventClick(_event: any): void {
    this.assignment.dueDate = _event.date;
    this.openModal('#createAssignments');
  }

  resetAssignmentField(_date: Date): void {
    this.assignment = new Assignment();
    this.assignment.type = '';
    this.assignment.dueDate = _date;
  }

  addAssignment(): void {
    this.assignment.completed = false;
    if (!this.formLabel) this.assignment.type = 'Misc';
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

        $('#createAssignments').modal('close');
      });
  }

  addEvent(): void {
    this.events.push({
      title: this.assignment.title,
      start: startOfDay(this.assignment.dueDate),
      end: endOfDay(this.assignment.dueDate),
      color: this.determineColor(this.assignment),
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

  openModal(_id: string): void {
    $(_id).modal('open');
  }

  getDescription(_event: CalendarEvent): string {
    return this.eDescription.get(_event).description;
  }

  // TODO: Is this necessary?
  handleEvent(action: string, event: CalendarEvent): void {}

  // TODO: Is this necessary?
  debug(): void {
    // console.log(event);
    // console.log(event.target);
    //console.log(this.changes);
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

  ////////////////////////////////////////////////////////////////////
  //
  // Error Handler
  //
  // Helper functions used to handle all or any error that comes
  // during the use of the service.
  //
  ////////////////////////////////////////////////////////////////////

  /**
   * Handles error that are received from API calls
   * @param {Reponse} _error the error from the API call
   */
  private handleError(_error: Response): void {
    if (_error.status == 401) {
      // Token is stale. Clear the user and token local storage, route them to login screen
      this._storage.deleteItem('token');
      this._storage.deleteItem('currentUser');

      // Add the reason for re-routing to login
      this._storage.setItem('expiredToken', 'true');

      // Route to the login page
      this._router.navigate(['/login']);
    } else {
      // API error, server could be down/crashed
      console.error(_error);
    }
  }

  /**
   * Handles error that comes when an assignment does not exist or is not found
   * @param {Assigment} _assignment the assignment that was attempted to use with the API
   */
  private handle404Error(_assignment: Assignment): void {
    // Find the assignment in the current day array
    for (let i = 0; i < this.currentDayArray.length; i++) {
      if (this.currentDayArray[i] == _assignment) {
        this.currentDayArray.splice(i, 1);
        break;
      }
    }

    // Remove the event linked to the assignment
    let event: CalendarEvent = this.aDescription.get(_assignment);
    this.events = this.events.filter(iEvent => iEvent !== event);
  }

  /**
   * Handles error that comes during an update API call
   * @param {string} _attribute a part of the object that couldn't be updated
   * @param {string} _reason why the attribute couldn't be updated.
   */
  private handleUpdateError(_attribute: string, _reason: string): void {
    switch (_reason) {
      case 'invalid':
        console.error('New %s was malformed', _attribute);
        break;
      case 'unchanged':
        console.error('New %s was unchanged', _attribute);
        break;
      default:
        console.error('New %s was invalid in some way', _attribute);
    }
  }
}
