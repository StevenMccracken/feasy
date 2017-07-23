import { Component, OnInit } from '@angular/core';

import { Assignment } from '../../objects/Assignment';
import { AssignmentService } from '../../services/assignment.service';

declare var $: any;

@Component({
  selector: 'app-to-do',
  templateUrl: './to-do.component.html',
  styleUrls: ['./to-do.component.css']
})
export class ToDoComponent implements OnInit {
  assignment: Assignment = new Assignment();
  assignments: Assignment[] = [];
  doneSorting: boolean = false;

  constructor(private _assignmentService: AssignmentService) {}

  ngOnInit() {
    this.assignments[0] = new Assignment();
    $(document).ready(function() {
      $('select').material_select();
      $('select').on('change', function(e) {
        var selected = e.currentTarget.selectedOptions[0].value;
        localStorage['type'] = selected;
        $('select').prop('selectedIndex', 0); //Sets the first option as selected
      });
    });

    this._assignmentService.get()
      .then((response: Assignment[]) => {
        this.assignments = response;
        console.log(this.assignments);

        this.sortAssignment();
      });
  }

  deleteEventAction(id: string, index: number): void {
    // TODO: Add a then and catch to this service call and update the this.assignments in the then
    this._assignmentService.delete(id);
    this.assignments.splice(index, 1);
  }

  enableEdit(index: number): void {
    this.assignments[index].editMode = !this.assignments[index].editMode;
    let id = `#descriptionEdit${index}`;
    console.log($(id).val());
    setTimeout(() => $(id).focus(), 1);
  }

  getEditMode(index: number): boolean {
    return this.assignments[index].editMode;
  }

  updateDescription(a: Assignment): void {
    a.editMode = false;

    // TODO: Add a meaningful then and catch for this service call
    this._assignmentService.update(a._id, a.description)
  }

  sortAssignment(): void {
    this.assignments.sort((a, b) => {
      return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });

    this.doneSorting = true;
  }
}
