interface Serializable<T> {
  deserialize(_input: Object): T;
}

export class Assignment implements Serializable<Assignment> {
  _id: string;
  googleId: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  userId: string;
  class: string;
  dateCreated: Date;
  type: string;
  description: string;

  // These allow click to edit functionality of tasks
  editModeType: boolean = false;
  editModeDate: boolean = false;
  editModeTitle: boolean = false;
  editModeDescription: boolean = false;

  /**
   * Converts a JSON representing an assignment to an Assignment object
   * @param {Object} [_input = {}] JSON containing assignment information
   * @return {Assignment} assignment with the attributes from the JSON input
   */
  deserialize(_input: Object = {}): Assignment {
    this._id = _input['_id'] || '';
    this.googleId = _input['googleId'] || '';
    this.title = _input['title'] || '';
    this.dueDate = new Date(_input['dueDate']);
    this.completed = _input['completed'] || false;
    this.class = _input['class'] || '';
    this.dateCreated = new Date(_input['dateCreated']);
    this.type = _input['type'] || '';
    this.description = _input['description'] || '';

    this.editModeType = false;
    this.editModeDate = false;
    this.editModeTitle = false;
    this.editModeDescription = false;

    return this;
  } // End deserialize()

  /**
   * Returns a completely new object with all of the same
   * attributes of the assignment that the function was called on
   * @return {Assignment} the deep-cloned assignment
   */
  deepCopy(): Assignment {
    const clone = new Assignment();
    clone._id = this._id;
    clone.googleId = this.googleId;
    clone.title = this.title;
    clone.dueDate = this.dueDate instanceof Date ? new Date(this.dueDate.getTime()) : this.dueDate;
    clone.completed = this.completed;
    clone.class = this.class;
    clone.dateCreated = this.dateCreated instanceof Date ? new Date(this.dateCreated.getTime()) : this.dateCreated;
    clone.type = this.type;
    clone.description = this.description;

    clone.editModeType = this.editModeType;
    clone.editModeDate = this.editModeDate;
    clone.editModeTitle = this.editModeTitle;
    clone.editModeDescription = this.editModeDescription;

    return clone;
  } // End deepCopy()

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

  getEditModeType(): boolean {
    return this.editModeType;
  } // End getEditModeType()

  getEditModeDate(): boolean {
    return this.editModeDate;
  } // End getEditModeDate()

  getEditModeTitle(): boolean {
    return this.editModeTitle;
  } // End getEditModeTitle()

  getEditModeDescription(): boolean {
    return this.editModeDescription;
  } // End getEditModeDescription()

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

  setEditModeType(_editModeType: boolean): void {
    this.editModeType = _editModeType;
  } // End getEditModeType()

  setEditModeDate(_editModeDate: boolean): void {
    this.editModeDate = _editModeDate;
  } // End getEditModeDate()

  setEditModeTitle(_editModeTitle: boolean): void {
    this.editModeTitle = _editModeTitle;
  } // End setEditModeTitle()

  setEditModeDescription(_editModeDescription: boolean): void {
    this.editModeDescription = _editModeDescription;
  } // End setEditModeDescription()
}
