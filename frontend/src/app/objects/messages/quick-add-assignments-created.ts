// Import our files
import { Assignment } from '../assignment';

export class QuickAddAssignmentsCreated {
  private assignments: Assignment[];

  constructor(private _assignments: Assignment[]) {
    this.assignments = _assignments;
  }

  getAssignments(): Assignment[] {
    return this.assignments;
  }
}
