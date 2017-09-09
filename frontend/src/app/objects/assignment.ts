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

  getId(): string {
    return this._id;
  }

  getTitle(): string {
    return this.title;
  }

  getDueDate(): Date {
    return this.dueDate;
  }

  getCompleted(): boolean {
    return this.completed;
  }

  getClass(): string {
    return this.class;
  }

  getDateCreated(): Date {
    return this.dateCreated;
  }

  getType(): string {
    return this.type;
  }

  getDescription(): string {
    return this.description;
  }

  getEditModeDescription(): boolean {
    return this.editModeDescription;
  }

  getEditModeTitle(): boolean {
    return this.editModeTitle;
  }

  setId(_id: string): void {
    this._id = _id;
  }

  setTitle(_title: string): void {
    this.title = _title;
  }

  setDueDate(_dueDate: Date): void {
    this.dueDate = _dueDate;
  }

  setCompleted(_completed: boolean): void {
    this.completed = _completed;
  }

  setClass(_class: string): void {
    this.class = _class;
  }

  setDateCreated(_dateCreated: Date): void {
    this.dateCreated = _dateCreated;
  }

  setType(_type: string): void {
    this.type = _type;
  }

  setDescription(_description: string): void {
    this.description = _description;
  }

  setEditModeDescription(_editModeDescription: boolean): void {
    this.editModeDescription = _editModeDescription;
  }

  setEditModeTitle(_editModeTitle: boolean): void {
    this.editModeTitle = _editModeTitle;
  }
}
