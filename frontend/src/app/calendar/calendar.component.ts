import { Subject } from 'rxjs/Subject';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  OnInit,
  Component,
  ViewChild,
  TemplateRef,
  ChangeDetectionStrategy,
} from '@angular/core';
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

import { Assignment } from '../objects/assignment';
import { LoginService } from '../services/login.service';
import { AssignmentService } from '../services/assignment.service';

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
export class CalendarComponent implements OnInit {

    @ViewChild('modalContent') modalContent: TemplateRef<any>;

    username: string;
    view: string = 'month';
    viewDate: Date = new Date();
    events: CalendarEvent[] = [];
    activeDayIsOpen: boolean = false;
    refresh: Subject<any> = new Subject();

    modalData: {
        action: string,
        event: CalendarEvent
    };

    actions: CalendarEventAction[] = [{
        label: '<i class="fa fa-fw fa-pencil"></i>',
        onClick: ({event}: {event: CalendarEvent}): void => {
            this.handleEvent('Edited', event);
        }
    }, {
        label: '<i class="fa fa-fw fa-times"></i>',
        onClick: ({event}: {event: CalendarEvent}): void => {
            this.deleteAssignment(event.title, false)
                .then((deleted) => {
                    if (deleted) {
                        this.events = this.events.filter(iEvent => iEvent !== event);
                        this.handleEvent('Deleted', event);
                    } else console.log('Couldn\'t delete event');
                });

        }
    }];

    /**
    events: CalendarEvent[] = [{
        start: subDays(startOfDay(new Date()), 1),
        end: addDays(new Date(), 1),
        title: 'A 3 day event',
        color: colors.red,
        actions: this.actions
    }, {
        start: startOfDay(new Date()),
        title: 'An event with no end date',
        color: colors.yellow,
        actions: this.actions,
        draggable: true
    }, {
        start: subDays(endOfMonth(new Date()), 3),
        end: addDays(endOfMonth(new Date()), 3),
        title: 'A long event that spans 2 months',
        color: colors.blue
    }, {
        start: addHours(startOfDay(new Date()), 2),
        end: new Date(),
        title: 'A draggable and resizable event',
        color: colors.yellow,
        actions: this.actions,
        resizable: {
            beforeStart: true,
            afterEnd: true
        },
        draggable: true
    }];
    */

    constructor(
        private router: Router,
        private modal: NgbModal,
        private assignmentService: AssignmentService
    ) { }

    /**
     * Creates a new assignment through the assignment service
     * @param  {Object}           info JSON of the assignment information
     * @return {Promise<boolean>}      whether or not the assignment was created
     */
    createAssignment(info: Object): Promise<boolean> {
        return this.assignmentService.createAssignment(this.username, info)
            .then((assignment) => {
                // Add the assignment to the calendar and refresh the view
                this.addAssignment(assignment, true);
                return true;
            })
            .catch(createErr => false);
    }

    /**
     * Adds an assignment to the calendar's events
     * @param {Assignment} assignment   the assignment to add to the calendar
     * @param {boolean}    refreshView  whether or not to refresh the view after the addition
     */
    addAssignment(assignment: Assignment, refreshView: boolean): void {
        this.events.push({
            start: assignment.dueDate,
            end: assignment.dueDate,
            title: assignment.id,
            color: colors.blue,
            actions: this.actions,
            resizable: { beforeStart: true, afterEnd: true },
            draggable: true
        });

        if (refreshView) this.refresh.next();
    }

    /**
     * Updates an assignment's due date
     * @param  {string}           assignmentId  the ID of the assignment to update
     * @param  {Date}             newDueDate    the new due date to update the assignment
     * @param  {boolean}          refreshView   whether or not to refresh the view after the update
     * @return {Promise<boolean>}               whether or not the assignment was updated
     */
    updateDueDate(assignmentId: string, newDueDate: Date, refreshView: boolean): Promise<boolean> {
        return this.assignmentService.updateDueDate(this.username, assignmentId, newDueDate)
            .then(success => {
                if (refreshView) this.refresh.next();
                return true;
            })
            .catch(updateErr => false);
    }

    /**
     * Deletes an assignment
     * @param  {string}           assignmentId  the ID of the assignment to delete
     * @param  {boolean}          refreshView   whether or not to refresh the view after the delete
     * @return {Promise<boolean>}               whether or not the assignment was deleted
     */
    deleteAssignment(assignmentId: string, refreshView: boolean): Promise<boolean> {
        return this.assignmentService.deleteAssignment(this.username, assignmentId)
            .then(success => {
                if (refreshView) this.refresh.next();
                return true;
            })
            .catch(deleteErr => false);
    }

    ngOnInit(): void {
        if (localStorage.getItem('currentUser') == null) {
            this.router.navigate(['/login']);
        } else {
            this.username = JSON.parse(localStorage.getItem('currentUser')).username;
            this.assignmentService.getAssignments(this.username)
                .then(assignments => assignments.forEach(assignment => this.addAssignment(assignment, false)))
                .then(() => this.refresh.next());
        }
    }

    dayClicked({date, events}: {date: Date, events: CalendarEvent[]}): void {
        if (isSameMonth(date, this.viewDate)) {
            if (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) {
                this.activeDayIsOpen = false;
                console.log('Closed %s/%s', date.getMonth(), date.getDay());
            } else if (events.length === 0) {
                this.activeDayIsOpen = false;
                console.log('Clicked on a day with no events');
            } else {
                this.activeDayIsOpen = true;
                this.viewDate = date;
                console.log('Clicked on a day with %s events', events.length);
            }
        }
    }

    eventTimesChanged({event, newStart, newEnd}: CalendarEventTimesChangedEvent): void {
        event.start = newStart;
        event.end = newEnd;

        this.updateDueDate(event.title, newStart, false)
            .then(updated => {
                if (updated) {
                    this.handleEvent('Dropped or resized', event);
                    this.refresh.next();
                } else console.log('Unable to update');
            });

    }

    handleEvent(action: string, event: CalendarEvent): void {
        this.modalData = { event, action };
        if (action == 'Edited') this.modal.open(this.modalContent, {size: 'lg'});
    }

    addEvent(): void {
        this.events.push({
            title: 'New event',
            start: startOfDay(new Date()),
            end: endOfDay(new Date()),
            color: colors.red,
            draggable: true,
            resizable: {
                beforeStart: true,
                afterEnd: true
            }
        });
        this.refresh.next();
    }
}
