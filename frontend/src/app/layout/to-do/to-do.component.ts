import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { Assignment } from '../../objects/Assignment';
import { AssignmentService } from '../../services/assignment.service';

declare var $: any;

@Component({
  selector: 'app-to-do',
  templateUrl: './to-do.component.html',
  styleUrls: ['./to-do.component.css'],
})
export class ToDoComponent implements OnInit {
  doneSorting = false;
  assignment = new Assignment();
  assignments: Assignment[] = [];

  constructor(private _router: Router, private _assignmentService: AssignmentService) {}

  ngOnInit() {
    this.assignments[0] = new Assignment();
    $(document).ready(function() {
      $('select').material_select();
      $('select').on('change', function(e) {
        let selected = e.currentTarget.selectedOptions[0].value;
        localStorage.setItem('type', selected);
        $('select').prop('selectedIndex', 0); // Sets the first option as selected
      });
    });

    this._assignmentService.getAll()
      .then((assignments: Assignment[]) => {
        this.assignments = assignments;
        this.sortAssignments();
      })
      .catch((getError: Response) => this.handleError(getError));
  }

  deleteEventAction(id: string, index: number): void {
    this._assignmentService.delete(id)
      .then(() => this.assignments.splice(index, 1))
      .catch((deleteError: Response) => {
        if (deleteError.status === 404) this.assignments.splice(index, 1);
        else this.handleError(deleteError);
      });
  }

  enableEdit(index: number): void {
    this.assignments[index].editMode = !this.assignments[index].editMode;
    let id = "#descriptionEdit"+index;
    setTimeout(() => $(id).focus(), 1);
  }

  getEditMode(index: number): boolean {
    return this.assignments[index].editMode;
  }

  /**
   * Updates an assignments description by calling the API
   * @param {Assignment} assignment the updated assignment
   */
  updateDescription(assignment: Assignment): void {
    assignment.editMode = false;
    this._assignmentService.updateDescription(assignment._id, assignment.description)
      .then(() => console.log('Updated description'))
      .catch((updateError: any) => {
        if (typeof updateError === 'string') this.handleUpdateError('description', updateError);
        else if (updateError.status === 404) this.handle404Error(assignment);
        else this.handleError(updateError);
      });
  }

  sortAssignments(): void {
    this.assignments.sort((a, b) => {
      return (a.dueDate.getTime() - b.dueDate.getTime());
    });

    this.doneSorting = true;
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
    for (let i = 0; i < this.assignments.length; i++) {
      if (this.assignments[i] == assignment) {
        this.assignments.splice(i, 1);
        break;
      }
    }
  }
}
