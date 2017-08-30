import { Injectable } from '@angular/core';
import { Assignment } from '../objects/assignment';

@Injectable()
export class LoadLearnService {

  _assignments: Assignment[] = [];
  _assignmentComplete: Assignment[] = [];
  _assignmentIncomplete: Assignment[] = [];

  constructor() { }

  getTaskArray(): Assignment[]{
    return this._assignments;
  }

  setTaskArray(array: Assignment[]): void{
    this._assignments = array;
  }
}
