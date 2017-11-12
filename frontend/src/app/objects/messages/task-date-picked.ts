// Import our files
import { Task } from '../task';

export class TaskDatePicked {
  private index: number;
  private task: Task;

  constructor(private _task: Task, private _index: number) {
    this.index = _index;
    this.task = _task;
  }

  getIndex(): number {
    return this.index;
  }

  getTask(): Task {
    return this.task;
  }

  setIndex(_index: number): void {
    this.index = _index;
  }

  setTask(_task: Task): void {
    this.task = _task;
  }
}
