// Import our files
import { Task } from './task';
import { COLORS } from './colors';

// Import 3rd-party libraries
import { CalendarEvent } from 'angular-calendar';

/**
 * Class that extends Calendar Event from the
 * angular calendar to embed Task data in each event
 */
export class FeasyCalendarEvent implements CalendarEvent {

  public title: string;
  public start: Date;
  public end: Date;
  public draggable: boolean;
  public resizable: any;

  constructor(public task: Task, public color: any) {
    this.title = this.task.getTitle();
    this.start = this.task.getDueDate();
    this.end = this.task.getDueDate();
    this.draggable = true;
    this.resizable = {
      beforeStart: true,
      afterEnd: true,
    };
  }

  getTask(): Task {
    return this.task;
  }

  setTask(_task: Task): void {
    this.task = _task;
  }

  setEventTitle(_title: string): void {
    this.title = _title;
  }

  setColor(_color: any): void {
    this.color = _color;
  }

  setStartAndEnd(_date: Date): void {
    this.start = _date;
    this.end = _date;
  }
}
