import { Router } from '@angular/router';
import { Component, OnInit, Inject } from '@angular/core';

import { DragulaService } from 'ng2-dragula';
import { Assignment } from '../../objects/assignment';
import { AssignmentService } from '../../services/assignment.service';
import { LocalStorageService } from '../../utils/local-storage.service';

declare var $: any;

@Component({
  selector: 'app-to-do',
  templateUrl: './to-do.component.html',
  styleUrls: ['./to-do.component.css'],
})
export class ToDoComponent implements OnInit {
  doneSorting: boolean = false;
  assignment: Assignment = new Assignment();
  date: Date = new Date();

  completedAssignments: Assignment[] = [];
  incompleteAssignments: Assignment[] = [];
  showlist: boolean = false;
  dragContent: boolean = false;

  completeEmpty:boolean = false;
  uncompleteEmpty: boolean = false;
  completeCounter: number = 0;
  uncompleteCounter: number = 0;

  constructor(
    private _router: Router,
    private _storage: LocalStorageService,
    private _dragulaService: DragulaService,
    private _assignmentService: AssignmentService
  ) {
    _dragulaService.drop
      .subscribe(value => this.onDrop(value, _dragulaService));
  }

  ngOnInit() {
    this.todoInitializer();
  }

  todoInitializer(): void{
    this.assignment.dueDate = new Date();
    this.completedAssignments = [], this.incompleteAssignments = [];
    this._assignmentService.getAll()
      .then((assignments: Assignment[]) => {
        if (assignments.length > 0) {
          for (let assignment of assignments){
            if (assignment.completed) this.completedAssignments.push(assignment);
            else this.incompleteAssignments.push(assignment);
          }

          this.completeEmpty = (this.completedAssignments.length === 0);
          this.completeCounter = this.completedAssignments.length;

          this.uncompleteEmpty = (this.incompleteAssignments.length === 0);
          this.uncompleteCounter = this.incompleteAssignments.length;

          this.sortAssignments();
          this.showlist = true;
        } else this.doneSorting = true;

        this.doneSorting = true;
        this.initializeform();
      })
      .catch((getError: Response) => {
        this.handleError(getError);
        this.initializeform();
      });
  }

  private onDrop(args, _dragulaService) {
    console.log(args);
    let info = args[1].id.split('-');
    let arr = (info[0] === 'unComplete') ? this.incompleteAssignments : this.completedAssignments;


    let index = parseInt(info[1]);
    let assignment = arr[index];
    let complete = args[2].id === 'completed';
    console.log(assignment);
    console.log('Updating assignment %s completed to %s', assignment._id, complete);
    if(complete != assignment.completed){
      console.log(complete);
      console.log(assignment.completed);
      this._assignmentService.updateCompleted(assignment._id, complete)
        .then(() => {
          this.uncompleteCounter = complete ? this.uncompleteCounter - 1 : this.uncompleteCounter + 1;
          this.completeCounter   = complete ? this.uncompleteCounter + 1 : this.completeCounter - 1;

          console.log('Completed counter: %d', this.completeCounter);
          console.log('Incomplete counter: %d', this.uncompleteCounter);

          this.uncompleteEmpty = this.uncompleteCounter === 0;
          this.completeEmpty = this.completeCounter === 0;
        })
        .catch((error: any) => {
          console.log(error);
          //this._dragulaService.find('')
        });
    }
  }

  initializeform(): void {
    let storage: LocalStorageService = this._storage;
    $(document).ready(function() {
      $('#select').material_select();
      $('#select').on('change', function(e) {
          let selected = e.currentTarget.selectedOptions[0].value;
          storage.setItem('type', selected);
          $('#select').prop('selectedIndex', 0); // Sets the first option as selected
      });

      $('.datepicker').pickadate({
        onSet: function(context) {
          console.log(context);
          storage.setItem('dueDate', (new Date(context.select)).toString());
          //this.assignment.dueDate = new Date(context.select);
        },
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 15, // Creates a dropdown of 15 years to control year,
        formatSubmit: 'yyyy/mm/dd',
      });
    });
  }

  addAssignment(): void {
    this.assignment.completed = false;
    this.assignment.dueDate = new Date(this._storage.getItem('dueDate'));

    this._assignmentService.create(this.assignment)
      .then((newAssignment: Assignment) => {
        this.updateArray(newAssignment);
        this.assignment = new Assignment();
      })
      .catch((createError: any) => {
        if (Array.isArray(createError)) {
          // Request was invalid and createError is an array containing invalid params
          console.error('Invalid parameters: %s', createError.join());
        } else this.handleError(createError);
      });
  }

  updateArray(assignment: Assignment): void {
    this.incompleteAssignments.push(assignment);
    this.sortAssignments();

    let storage: LocalStorageService = this._storage;
    $(document).ready(function() {
      $('.datepicker').pickadate({
        onSet: function(context) {
          console.log(context);
          storage.setItem('dueDate', (new Date(context.select)).toString());
          //this.assignment.dueDate = new Date(context.select);
        },
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 15, // Creates a dropdown of 15 years to control year
        formatSubmit: 'yyyy/mm/dd',
      });
    });
  }

  getTypeLabel(): boolean {
    return this._storage.getItem('qsLabel') === 'true';
  }

  getDescription(): boolean {
    return this._storage.getItem('qsDescription') === 'true';
  }

  deleteEventAction(assignment: Assignment): void {
    let index = this.completedAssignments.indexOf(assignment);
    let incomplete = index < 0;
    console.log(assignment);
    this._assignmentService.delete(assignment._id)
      .then(() => {
          this.spliceArray(assignment, incomplete);
          console.log(assignment);
          console.log(incomplete);
      })
      .catch((deleteError: Response) => {
        if (deleteError.status === 404) {
          alert('something wrong :(');
        } else this.handleError(deleteError);
      });
  }

  spliceArray(assignment: Assignment, incomplete: boolean): void{
    if(incomplete){
      let index = this.incompleteAssignments.indexOf(assignment);
      this.incompleteAssignments.splice(index, 1);
    }else{
      let index = this.completedAssignments.indexOf(assignment);
      this.completedAssignments.splice(index, 1)
    }
  }

  enableEdit(assignment: Assignment, index: number, type: string): void {
    if (assignment.completed) return null;

    if (type === 'description' && !assignment.editModeDate) {
      assignment.editModeDescription = !assignment.editModeDescription;
      let id = `#descriptionEdit${index}`;
      setTimeout(() => $(id).focus(), 1);
    }

    if (type === 'title' && !assignment.editModeDate) {
      assignment.editModeTitle = !assignment.editModeTitle;
      let id = `#titleEdit${index}`;
      setTimeout(() => $(id).focus(), 1);
    }

    if (type === 'all') {
      assignment.editModeTitle = true;
      assignment.editModeDescription = true;
      assignment.editModeDate = true;
      let id = `#titleEdit${index}`;

      setTimeout(() => $(id).focus(), 1);
      let $input = $(`#datetime${index}`).pickadate();
      let picker = $input.pickadate('picker');
      picker.set('select', assignment.dueDate);
    }
  }

  /**
   * Updates an assignments description by calling the API
   * @param {Assignment} assignment the updated assignment
   */
  updateDescription(assignment: Assignment): void {
    if (!assignment.editModeDate) {
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
    if (!assignment.editModeDate) {
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

    if ($(`#datetime${index}`)[0].value !== '') {
      let newDueDate = new Date($(`#datetime${index}`)[0].value);
      this._assignmentService.updateDueDate(id, newDueDate)
        .then(() => {
          console.log('Updated due date');
          assignment.dueDate = newDueDate;
        })
        .catch((updateError: any) => {
          if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
          else if (updateError.status === 404) this.handle404Error(assignment);
          else this.handleError(updateError);
        });
    }

    this._assignmentService.updateType(id, assignment.type)
      .then(() => console.log('Update Type'))
      .catch((updateError: any) => {
        if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
        else if (updateError.status === 404) this.handle404Error(assignment);
        else this.handleError(updateError);
      });

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
    this.incompleteAssignments.sort((a, b) => {
      return (a.dueDate.getTime() - b.dueDate.getTime());
    });

    this.completedAssignments.sort((a, b) => {
      return (a.dueDate.getTime() - b.dueDate.getTime());
    });

    this.doneSorting = true;
  }

  setDraggableTrue(i: number): void {
    this.dragContent = true;
  }

  setDraggableFalse(i: number): void {
    this.dragContent = false;
  }

  followContent(e: any, i: number): void {
    if (this.dragContent) $();
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
   * Handles errors received from API calls
   * @param {Response} _error the error response from the API call
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

  private handle404Error(assignment: Assignment): void {
    // Find the assignment in the assignments array
    for (let i = 0; i < this.incompleteAssignments.length; i++) {
      if (this.incompleteAssignments[i] == assignment) {
        this.incompleteAssignments.splice(i, 1);
        break;
      }
    }
  }

  // TODO: Are these necessary?
  debug(e: any): void {
    console.log(e);
    //console.log(this.date);
    console.log(this.assignment);
  }

  debuger(i: number): void {
    console.log($(`#datetime${i}`)[0].value);
  }

  dummyFunct(): string {
    return "2015/06/20";
  }
}
