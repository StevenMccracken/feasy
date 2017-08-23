import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { Assignment } from '../../objects/assignment';
import { AssignmentService } from '../../services/assignment.service';
import { DragulaService } from 'ng2-dragula';

declare var $: any;

@Component({
  selector: 'app-to-do',
  templateUrl: './to-do.component.html',
  styleUrls: ['./to-do.component.css'],
})
export class ToDoComponent implements OnInit {
  doneSorting = false;
  assignment = new Assignment();
  date: Date = new Date();

  assignmentsComplete: Assignment[] = [];
  assignmentsUncomplete: Assignment[] = [];
  showlist: boolean = false;
  dragContent: boolean = false;


  completeEmpty: boolean = false;
  uncompleteEmpty: boolean = false;
  completeCounter: number = 0;
  uncompleteCounter: number = 0;

  constructor(private _router: Router,
              private _assignmentService: AssignmentService,
              private _dragulaService: DragulaService) {
                _dragulaService.drop.subscribe((value) => {
                  this.onDrop(value);
                });
              }

  ngOnInit() {
    this.assignment.dueDate = new Date();
    this.assignmentsComplete = [];
    this.assignmentsUncomplete = [];
    this._assignmentService.getAll()
      .then((assignments: Assignment[]) => {
        if(assignments.length > 0){
          for(let a of assignments){
            if(a.completed) this.assignmentsComplete.push(a);
            else            this.assignmentsUncomplete.push(a);
          }
          this.completeEmpty = (this.assignmentsComplete.length === 0);
          this.completeCounter = this.assignmentsComplete.length;
          this.uncompleteEmpty = (this.assignmentsUncomplete.length === 0);
          this.uncompleteCounter = this.assignmentsUncomplete.length;
          this.sortAssignments();
          this.showlist = true;
        }else
          this.doneSorting = true;
        this.initializeform();
      })
      .catch((getError: Response) => {

          this.handleError(getError);
          this.initializeform();
      });

  }

  private onDrop(args){
    console.log(args);
    let info = args[1].id.split('-');
    let arr = []
    if(info[0] === 'unComplete')  arr = this.assignmentsUncomplete;
    else                          arr = this.assignmentsComplete;
    let index = parseInt(info[1]);
    let assignment = arr[index];
    let complete = (args[2].id === 'completed') ? true: false;
    this._assignmentService.updateCompleted(assignment._id, complete)
                           .then(() => {
                             if(complete){
                               this.uncompleteCounter--;
                               this.completeCounter++;
                               console.log(this.completeCounter);
                             }else{
                               this.completeCounter--;
                               this.uncompleteCounter++;
                               console.log(this.uncompleteCounter);
                             }
                             this.uncompleteEmpty = (this.uncompleteCounter === 0);
                             this.completeEmpty = (this.completeCounter === 0);
                             console.log(`${complete}`);
                           })
                           .catch((error: any) => console.log(error));

  }

  initializeform(): void{
    $(document).ready(function() {
      $('#select').material_select();
      $('#select').on('change', function(e) {
          let selected = e.currentTarget.selectedOptions[0].value;
          localStorage.setItem('type', selected);
          $('#select').prop('selectedIndex', 0); // Sets the first option as selected
      });
      $('.datepicker').pickadate({
        onSet: (context) => {
          console.log(context);
          localStorage.setItem('dueDate', (new Date(context.select)).toString());
          //this.assignment.dueDate = new Date(context.select);
        },
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 15, // Creates a dropdown of 15 years to control year,
        formatSubmit: 'yyyy/mm/dd'
      });
    });
  }

  addAssignment(): void {
    this.assignment.completed = false;
    this.assignment.dueDate = new Date(localStorage['dueDate']);

    this._assignmentService.create(this.assignment)
      .then((newAssignment: Assignment) => {
        this.updateArray(newAssignment);
      })
      .catch((createError: any) => {
        if (Array.isArray(createError)) {
          // Request was invalid and createError is an array containing invalid params
          console.error('Invalid parameters: %s', createError.join());
        } else this.handleError(createError);
      });
  }

  updateArray(assignment: Assignment): void{
    this.assignmentsUncomplete.push(assignment);
    this.sortAssignments();
    $(document).ready(function() {
      $('.datepicker').pickadate({
        onSet: (context) => {
          console.log(context);
          localStorage.setItem('dueDate', (new Date(context.select)).toString());
          //this.assignment.dueDate = new Date(context.select);
        },
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 15, // Creates a dropdown of 15 years to control year
        formatSubmit: 'yyyy/mm/dd'
      });
    });
  }

  getTypeLabel(): boolean{
    return (localStorage['qsLabel'] === 'true') ? true: false;
  }

  getDescription(): boolean {
    return (localStorage['qsDescription'] === 'true') ? true: false;
  }
  deleteEventAction(a: Assignment): void {
    let index = -1;
    index = this.assignmentsComplete.indexOf(a);
    let inComplete = (index >= 0) ? true: false;
    this._assignmentService.delete(a._id)
      .then(() => {
        if(inComplete)
          this.assignmentsComplete.splice(index, 1);
        else
          this.assignmentsUncomplete.splice(index, 1);
      })
      .catch((deleteError: Response) => {
        if (deleteError.status === 404){
          if(inComplete)
            this.assignmentsComplete.splice(index, 1);
          else
            this.assignmentsUncomplete.splice(index, 1);
        }
        else this.handleError(deleteError);
      });
  }

  enableEdit(assignment: Assignment, index: number, type: string): void {
    if(assignment.completed){
      return null;
    }
    if(type === 'description' && !assignment.editModeDate){
      assignment.editModeDescription = !assignment.editModeDescription;
      let id = `#descriptionEdit${index}`;
      setTimeout(() => $(id).focus(), 1);
    }
    if(type === 'title' && !assignment.editModeDate){
      assignment.editModeTitle = !assignment.editModeTitle;
      let id = `#titleEdit${index}`;
      setTimeout(() => $(id).focus(), 1);
    }
    if(type === 'all'){
      assignment.editModeTitle = true;
      assignment.editModeDescription = true;
      assignment.editModeDate = true;
      let id = `#titleEdit${index}`;
      setTimeout(() => $(id).focus(), 1);
      let $input = $('#datetime'+index).pickadate();
      let picker = $input.pickadate('picker');
      picker.set('select', assignment.dueDate);
    }

  }

  /**
   * Updates an assignments description by calling the API
   * @param {Assignment} assignment the updated assignment
   */
  updateDescription(assignment: Assignment): void {
    if(!assignment.editModeDate){
      assignment.editModeDescription = false;
      this._assignmentService.updateDescription(assignment._id, assignment.description)
        .then(() => console.log('Updated description'))
        .catch((updateError: any) => {
          if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
          else if (updateError.status === 404) this.handle404Error(assignment);
          else this.handleError(updateError);
        });
    }
  }

  /**
   * Update an assigment's title by calling the API
   * @param {Assigment} assigment the update assigment
   */
   updateTitle(assignment: Assignment): void {
     if(!assignment.editModeDate){
       assignment.editModeTitle = false;
       this._assignmentService.updateTitle(assignment._id, assignment.title)
         .then(() => console.log('Updated title'))
         .catch((updateError: any) => {
           if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
           else if (updateError.status === 404) this.handle404Error(assignment);
           else this.handleError(updateError);
         });
     }
   }

   /**
    * Update an assigment's title by calling the API
    * @param {Assigment} assigment the update assigment
    */
    updateTask(assignment: Assignment, index: number): void {
      let id = assignment._id;
      assignment.editModeTitle = false;
      assignment.editModeDescription = false;
      assignment.editModeDate = false;
      this._assignmentService.updateTitle(id, assignment.title)
        .then(() => console.log('Updated title'))
        .catch((updateError: any) => {
          if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
          else if (updateError.status === 404) this.handle404Error(assignment);
          else this.handleError(updateError);
        });
      if($("#datetime"+index)[0].value !== ""){
        let newDueDate = new Date($("#datetime"+index)[0].value);
        this._assignmentService.updateDueDate(id, newDueDate)
          .then(() => {
            console.log("Updated Due Date");
            assignment.dueDate = newDueDate;
          })
          .catch((updateError: any) => {
            if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
            else if (updateError.status === 404) this.handle404Error(assignment);
            else this.handleError(updateError);
          });
        }
      this._assignmentService.updateDescription(id, assignment.title)
        .then(() => console.log('Updated description'))
        .catch((updateError: any) => {
          if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
          else if (updateError.status === 404) this.handle404Error(assignment);
          else this.handleError(updateError);
        });
    }

  sortAssignments(): void {
    this.doneSorting = false;
    this.assignmentsUncomplete.sort((a, b) => {
      return (a.dueDate.getTime() - b.dueDate.getTime());
    });
    this.assignmentsComplete.sort((a, b) => {
      return (a.dueDate.getTime() - b.dueDate.getTime());
    });

    this.doneSorting = true;
  }
  setDraggableTrue(i: number): void{
    this.dragContent = true;
  }
  setDraggableFalse(i: number): void{
    this.dragContent = false;

  }
  followContent(e: any, i: number): void{
    if(this.dragContent){
      $()
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
   *  */
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

  private handle404Error(assignment: Assignment): void {
    // Find the assignment in the assignments array
    for (let i = 0; i < this.assignmentsUncomplete.length; i++) {
      if (this.assignmentsUncomplete[i] == assignment) {
        this.assignmentsUncomplete.splice(i, 1);
        break;
      }
    }
  }

  debug(e: any): void{
    console.log(e);
    //console.log(this.date);
    console.log(this.assignment);
  }
  debuger(i: number): void{
    console.log($("#datetime"+i)[0].value);
  }
  dummyFunct(): string{
    return "2015/06/20";
  }

}
