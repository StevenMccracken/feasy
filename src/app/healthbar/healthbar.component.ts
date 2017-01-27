import { Component, OnInit } from '@angular/core';
import { Assignment } from '../objects/assignment';
import { ASSIGNMENTS } from '../mock-data/mock-assignment';
import { AssignmentService } from '../service/assignment.service';

@Component({
  selector: 'app-healthbar',
  templateUrl: './healthbar.component.html',
  styleUrls: ['./healthbar.component.css']
})

export class HealthbarComponent implements OnInit {
  type_HOMEWORK = 'homework';
  type_TEST = 'test';
  type_QUIZ = 'quiz';
  type_PROJECT = 'project';

  homeworkCounts: number[] = [ 0, 0, 0 ];
  testCounts:     number[] = [ 0, 0, 0 ];
  quizCounts:     number[] = [ 0, 0, 0 ];
  projectCounts:  number[] = [ 0, 0, 0 ];

  constructor(
    private assignmentService: AssignmentService
  ) { }

  /*
    This method returns the assignments that are due in the next 10 days.
    It filters any number of Assignment objects as input and returns those
    same objects if their due date is within 10 days of the current time.
  */
  getAssignments_DueSoon(assignments: Assignment[], dayLimit: number): Assignment[] {
    return assignments.filter(function (assignment) {
      return (((assignment.due - Math.round(+new Date()/1000))/86400).valueOf() <= dayLimit);
    });
  }

  /*
    This method returns the "due date category" of an assignment based on it's actual due date.
    If the assignment is due within the category 0 limit, the category will be 0.
    If the assignment is due later than the category 0 limit but less than the category 1 limit, the category will be 1.
    If the assignment is due later than the category 1 limit but less than the category 2 limit, the category will be 2.
  */
  getDateCategory(assignment: Assignment, category0Limit: number, category1Limit: number, category2Limit: number): number {
    let dueDateCategory = -1; // Default value if due date is further than category2Limit days away

    // Turn the assignment due date into days until it is due
    let daysOut = Math.floor(((assignment.due - Math.round(+new Date()/1000))/86400).valueOf());
    console.log(assignment.name + " is " + daysOut + " days away");
    if(daysOut <= category0Limit) {
      dueDateCategory = 0;
    } else if(daysOut > category0Limit && daysOut <= category1Limit) {
      dueDateCategory = 1;
    } else if(daysOut > category1Limit && daysOut <= category2Limit) {
      dueDateCategory = 2;
    }
    return dueDateCategory;
  }

  /*
    This method counts the number of each assignment type based on their "due date category".
    It tallies the assignments of each type based on when they are due.
  */
  countAssignmentDueDates(assignments: Assignment[]): void {
    for(let assignment of assignments) {
      let dueDateCategory = this.getDateCategory(assignment, 2, 5, 10);

      if(dueDateCategory != -1) {
        let type = assignment.type;
        switch (type) {
          case this.type_HOMEWORK:
            this.homeworkCounts[dueDateCategory]++;
          break;
          case this.type_TEST:
            this.testCounts[dueDateCategory]++;
          break
          case this.type_QUIZ:
            this.quizCounts[dueDateCategory]++;
          break;
          case this.type_PROJECT:
            this.projectCounts[dueDateCategory]++;
          break;
          default:
        }
      }
    }
  }

  ngOnInit() {
    // Get all assignments for a specific user
    let allAssignments = ASSIGNMENTS;
    // TODO: Fix this commented out call to assignmentService
    /* let allAssignments = new Array<Assignment>();
    this.assignmentService.getAssignments(2)
      .then(a => allAssignments = a);*/

    // Filter out assignments that are more than 10 days away
    let assignmentsDueSoon = this.getAssignments_DueSoon(allAssignments, 10);

    // Count the homeworks, tests, quizzes, and projects
    this.countAssignmentDueDates(assignmentsDueSoon);
  }
}
