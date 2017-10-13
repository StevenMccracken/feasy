import { Assignment } from '../assignment';

export class TaskDatePicked {
  private index: number;
  private assignment: Assignment;

  constructor(private _assignment: Assignment, private _index: number) {
    this.index = _index;
    this.assignment = _assignment;
  }

  getIndex(): number {
    return this.index;
  }

  getAssignment(): Assignment {
    return this.assignment;
  }

  setIndex(_index: number): void {
    this.index = _index;
  }

  setAssignment(_assignment: Assignment): void {
    this.assignment = _assignment;
  }
}
