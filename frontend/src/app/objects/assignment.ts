interface Serializable<T> {
  deserialize(_input: Object): T;
}

export class Assignment implements Serializable<Assignment> {
  _id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  userId: string;
  class: string;
  dateCreated: Date;
  type: string;
  description: string;

  // These allow click to edit functionality of tasks
  editModeDate: boolean = false;
  editModeTitle: boolean = false;
  editModeDescription: boolean = false;

  /**
   * Converts a JSON representing an assignment to an Assignment object
   * @param {Object = {}} _input JSON containing assignment information
   * @return {Assignment} assignment with the attributes from the JSON input
   */
  deserialize(_input: Object = {}): Assignment {
    this._id = _input['_id'];
    this.title = _input['title'];
    this.dueDate = new Date(_input['dueDate']);
    this.completed = _input['completed'];
    this.class = _input['class'];
    this.dateCreated = new Date(_input['dateCreated']);
    this.type = _input['type'];
    this.description = _input['description'];
    this.editModeDescription = false;
    this.editModeTitle = false;

    return this;
  }
}
