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


import { Router } from '@angular/router';

//object decleration
import { Assignment } from '../../objects/Assignment';
import { Observable } from 'rxjs/Observable';


//service decleration
import { AssignmentService } from '../../services/assignment.service';

//used to access jQuery and Materialize script
declare var $: any;
declare var Materialize:any;


//Define colors for events
//@gray   : events that was before current date
//@red    : events that are close to current date 6 days or more
//@yellow : events that are close to current date 15 days or more
//@blue   : events that are far from current date
const colors: any = {
  gray:{
    primary: '#8c8c8c',
    secondary: '#bfbfbf'
  },
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
  ///////////////////VARIABLE DECLERATION//////////////////////////////////////////////
  //assignment object used for the assignment form
  assignment: Assignment = new Assignment();

  //set the default calendar view to month
  view: string = 'month';

  //this stores the event for the current day picked
  currentDayArray: Assignment[];

  //this allows the calendar to tell which date you are on
  viewDate: Date = new Date();

  //IMPORTANT! USE THIS TO STORE TARGET INTO A VARIABLE
  e:any;

  catagorySelect: boolean = false;
  //USE THIS HASHMAP TO STORE A REFERENCE FOR TASK -> EVENTS & EVENTS -> TASK
  eDescription: Map<CalendarEvent, Assignment> = new Map<CalendarEvent, Assignment>();
  aDescription: Map<Assignment, CalendarEvent> = new Map<Assignment, CalendarEvent>();

  //array to store all the calendar event
  events: CalendarEvent[]  = new Array<CalendarEvent>();

  //turn off active day
  activeDayIsOpen: boolean = false;
  onetime: boolean = false;
  timer: any;

  ////////////////////////////////////////////////////////////////////////////////////////
  constructor(private router: Router, private _assignmentService: AssignmentService){}

  ngOnInit(){
    $(document).ready(function() {
      $('#select').material_select();
      $('#select').on('change', function(e) {
          var selected = e.currentTarget.selectedOptions[0].value;
          localStorage['type'] = selected;
          $('#select').prop('selectedIndex', 0); //Sets the first option as selected
      });

    });
    $('#viewEdit').modal({
      dismissible: false,
      ready: ()=> {console.log('open modal');}
    });
    console.log($('#viewEdit').modal());
    $('.datepicker').pickadate({
      onSet: (context) => {
         this.assignment.dueDate = new Date(context.select);},
         selectMonths: true, // Creates a dropdown to control month
         selectYears: 15 // Creates a dropdown of 15 years to control year
     });
    this.assignment.type = "";
    this.initializeCalendar();

  }

  //STORES THE TARGET
  setEvent(event: any){
    if($(event.target).hasClass('cal-cell-top')){
      this.e = event.target;
    }else{
      this.e = null;
    }
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

  deleteEventAction(assignment: Assignment, index: number): void {
    this.currentDayArray.splice(index, 1);
    let event: CalendarEvent = this.aDescription.get(assignment);
    this.events = this.events.filter(iEvent => iEvent !== event);
    this._assignmentService.delete(assignment._id)
                           .then((res)=> console.log(res));
  }

  //////////////////////// INTIALIZE ITEM IN CALENDAR ////////////////////////////////////////////////
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
      let Event: CalendarEvent = { start: new Date(a.dueDate),
                                   end: new Date(a.dueDate),
                                   title: a.title,
                                   color: (new Date() > new Date(a.dueDate)) ? colors.gray:
                                          (addDays(new Date(), 5) >  new Date(a.dueDate)) ? colors.red:
                                          (addDays(new Date(), 14) > new Date(a.dueDate)) ? colors.yellow:
                                          colors.blue,
                                   actions: this.actions,
                                   draggable: true};
      SomeArray.push(Event);
      this.eDescription.set(Event, a);
      this.aDescription.set(a, Event);
    }

    let variable: CalendarEvent[] = this.events.concat(SomeArray);
    this.events = variable;
    this.refresh.next();
  }

  //////////////////////////////////////////////////////////////////////


  enableEdit(assignment: Assignment, index: number):void{
    assignment.editMode = !assignment.editMode;
    let id = '#descriptionEdit'+index;
    setTimeout(()=>{$(id).focus();}, 1);
  }

  getEditMode(event: CalendarEvent): boolean{
    return this.eDescription.get(event).editMode;
  }

  monthEventClick(event: any){
    this.onetime = !this.onetime;
    if(this.onetime){
      let eventArry:CalendarEvent[] = event.day.events;
      this.assignment.dueDate = new Date(event.day.date);
      this.currentDayArray = [];
      for(let a of eventArry){
        this.currentDayArray.push(this.eDescription.get(a));
      }
      if(this.currentDayArray.length !== 0)
        this.timer = setTimeout(() => { this.displayPopUp(); this.onetime = !this.onetime;}, 200);
      else{
        this.onetime = !this.onetime;
        this.openView(event.day.date);
      }
    }else{
      clearTimeout(this.timer);
      let eventArry:CalendarEvent[] = event.day.events;
      this.openView(event.day.date);
    }
  }

  displayPopUp(): void{

      if(this.e != null){
        if($(this.e).is('#popup')) {
          $(this.e).children(".show").css("display", "inline-block");
          let prev_e = this.e;
          //console.log($(prev_e).children());
          console.log($(prev_e).children(".show"));
          setTimeout(()=> {$(prev_e).children(".show").css("display","none");}, 3000);
        }
        else{
          $(this.e).attr('id', 'popup');
          let data:string = "<div id='popup' class='popuptext show'>";
          for(let a of  this.currentDayArray){
            data+= a.title + "<br>"
          }
          data+= "</div>"
          $(this.e).addClass("popup");
          this.e.insertAdjacentHTML('afterbegin', data);
          let prev_e = this.e;
          //console.log($(prev_e).children());
          console.log($(prev_e).children(".show"));
          setTimeout(()=> {$(prev_e).children(".show").css("display","none");}, 3000);
        }
      }
  }

  openView(dueDate: Date): void{
    this.assignment = new Assignment();
    this.assignment.completed = false;
    this.assignment.type = '';
    this.assignment.dueDate = new Date(dueDate);
    $('#viewEvent').modal('open');
  }

  resetField(): void{
    console.log("done");
  }
  eventTimesChanged({event, newStart, newEnd}: CalendarEventTimesChangedEvent): void {
    event.start = newEnd;
    event.end = newEnd;
    //this.handleEvent('Dropped or resized', event);
    this.refresh.next();
    this._assignmentService.changeTime(this.eDescription.get(event)._id, newEnd)
                           .then(res => console.log(res));
  }

  updateDescription(assignment: Assignment): void{
    let index = assignment._id;
    assignment.editMode = false;
    this._assignmentService.update(index, assignment.description)
                           .then(()=> {
                           });

  }

  test():void{
    this.catagorySelect = true;
    console.log(this.catagorySelect);
  }

  dayEventClick(event:any): void{
    this.assignment.dueDate = event.date;
    this.openModal('#createAssignments');
  }

  resetAssignmentField(date: Date): void{
    this.assignment = new Assignment();
    this.assignment.type = "";
    this.assignment.dueDate = new Date(date);
  }

  addAssignment(): void{
    this.assignment.completed = false;
    console.log(this.assignment.type);
    this._assignmentService.create(this.assignment)
                           .then((response) => {
                             console.log(response.json());
                             this.assignment.type = response.json().type;
                             this.assignment._id = response.json()._id;
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
        afterEnd: true
      },
      actions: this.actions
    });
    this.eDescription.set(this.events[this.events.length-1], this.assignment);
    this.aDescription.set(this.assignment, this.events[this.events.length-1]);
    this.refresh.next();
  }



  //////////////////// HELPER FUNCTIONS /////////////////////
  openModal(id: string): void{
    $(id).modal('open');
  }

  getDescription(event: CalendarEvent): string{
    return this.eDescription.get(event).description;
  }

  //////////// NOT SURE IF NEEDED /////////////////////
  handleEvent(action: string, event: CalendarEvent): void {
    //nothing for now.
  }

  debug(event: any): void{
    // console.log(event.y);
    console.log(event);
    console.log(event.target);
  }

  dayClicked({date, events}: {date: Date, events: CalendarEvent[]}): void {
    console.log("not happeneing");
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

}
