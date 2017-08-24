interface Serializable<T> {
  deserialize(input: Object): T;
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

  /**
   * booleans that allows click to edit functionality of tasks
   */
  editModeDescription: boolean = false;
  editModeTitle: boolean = false;
  editModeDate: boolean = false;

  /**
   * Converts a JSON representing an assignment to an Assignment object
   * @param {Object} input JSON containing assignment information
   * @return {Assignment} assignment with the attributes from the JSON input
   */
  deserialize(input) {
    this._id = input._id;
    this.title = input.title;
    this.dueDate = new Date(input.dueDate);
    this.completed = input.completed;
    this.class = input.class;
    this.dateCreated = new Date(input.dateCreated);
    this.type = input.type;
    this.description = input.description;
    this.editModeDescription = false;
    this.editModeTitle = false;

    return this;
  }
}
