import { Injectable } from '@angular/core';

import { Assignment } from '../objects/assignment';
import { ASSIGNMENTS } from '../mock-data/mock-assignment';

@Injectable()
export class AssignmentService {

  // TODO: Implement sending of user id to get assignments of that user
  getAssignments(uid: number): Promise<Assignment[]> {
    return Promise.resolve(ASSIGNMENTS);
  }

  getAssignment(uid: number, aid: number): Promise<Assignment> {
    return this.getAssignments(uid)
      .then(assignments => assignments.find(assignment => assignment.assign_id === aid));
  }
}
