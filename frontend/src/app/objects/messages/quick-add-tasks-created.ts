// Import our files
import { Task } from '../task';

export class QuickAddTasksCreated {
  private tasks: Task[];

  constructor(private _tasks: Task[]) {
    this.tasks = _tasks;
  }

  getTasks(): Task[] {
    return this.tasks;
  }
}
