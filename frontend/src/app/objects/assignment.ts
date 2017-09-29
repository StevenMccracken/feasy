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
   * @param {Object} [_input = {}] JSON containing assignment information
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
  } // End deserialize()

  getId(): string {
    return this._id;
  } // End getId()

  getTitle(): string {
    return this.title;
  } // End getTitle()

  getDueDate(): Date {
    return this.dueDate;
  } // End getDueDate()

  getCompleted(): boolean {
    return this.completed;
  } // End getCompleted()

  getClass(): string {
    return this.class;
  } // End getClass()

  getDateCreated(): Date {
    return this.dateCreated;
  } // End getDateCreated()

  getType(): string {
    return this.type;
  } // End getType()

  getDescription(): string {
    return this.description;
  } // End getDescription()

  getEditModeDescription(): boolean {
    return this.editModeDescription;
  } // End getEditModeDescription()

  getEditModeTitle(): boolean {
    return this.editModeTitle;
  } // End getEditModeTitle()

  getDueDateInUnixMilliseconds(): number {
    return this.dueDate.getTime();
  } // End getDueDateInUnixMilliseconds()

  getDueDateInUnixSeconds(): number {
    return Math.round(this.getDueDateInUnixMilliseconds() / 1000);
  } // End getDueDateInUnixSeconds()

  setId(_id: string): void {
    this._id = _id;
  } // End setId()

  setTitle(_title: string): void {
    this.title = _title;
  } // End setTitle()

  setDueDate(_dueDate: Date): void {
    this.dueDate = _dueDate;
  } // End setDueDate()

  setCompleted(_completed: boolean): void {
    this.completed = _completed;
  } // End setCompleted()

  setClass(_class: string): void {
    this.class = _class;
  } // End setClass()

  setDateCreated(_dateCreated: Date): void {
    this.dateCreated = _dateCreated;
  } // End setDateCreated()

  setType(_type: string): void {
    this.type = _type;
  } // End setType()

  setDescription(_description: string): void {
    this.description = _description;
  } // End setDescription()

  setEditModeDescription(_editModeDescription: boolean): void {
    this.editModeDescription = _editModeDescription;
  } // End setEditModeDescription()

  setEditModeTitle(_editModeTitle: boolean): void {
    this.editModeTitle = _editModeTitle;
  } // End setEditModeTitle()
}
