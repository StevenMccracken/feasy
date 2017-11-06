// Import angular packages
import {
  OnInit,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';

// Import 3rd-party libraries
import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs/Subscription';

// Import our files
import { Task } from '../../objects/task';
import { Error } from '../../objects/error';
import { LocalError } from '../../objects/local-error';
import { RemoteError } from '../../objects/remote-error';
import { TaskService } from '../../services/task.service';
import { ErrorService } from '../../services/error.service';
import { MessagingService } from '../../services/messaging.service';
import { CommonUtilsService } from '../../utils/common-utils.service';
import { LocalStorageService } from '../../utils/local-storage.service';
import { TaskDatePicked } from '../../objects/messages/task-date-picked';
import { QuickSettingsService } from '../../services/quick-settings.service';

declare var $: any;

@Component({
  selector: 'app-to-do',
  templateUrl: './to-do.component.html',
  styleUrls: ['./to-do.component.css'],
})
export class ToDoComponent implements OnInit {
  today: Date = new Date();

  newTask: Task;
  currentEditingTaskCopy: Task;
  currentEditingTaskIndex: number;

  showBothLists: boolean = false;
  showCompletedList: boolean = false;
  showIncompleteList: boolean = false;

  completedTasks: Task[];
  incompleteTasks: Task[];

  // Materialize date-picker holder
  newDatePicker: any;
  existingDatePicker: any;

  // Subscription used to receive messages about when a row in the incomplete section is clicked
  taskRowSelectedSubscription: Subscription;

  private times: Object = {
    displayMessage: 5000,
    scrollDuration: 375,
    incompleteListErrorMessage: 7500,
  };

  errors: Object = {
    general: {
      occurred: false,
      message: '',
      defaultMessage: 'Something bad happened. Please try that again or contact us at feasyresponse@gmail.com to fix this issue.',
    },
    completedTasks: {
      occurred: false,
      message: '',
      defaultMessage: 'Unable to complete that task right now. Please try again.',
    },
    incompleteTasks: {
      occurred: false,
      message: '',
      defaultMessage: 'Unable to update that task to be incomplete right now. Please try again.',
    },
    taskDoesNotExist: {
      occurred: false,
      message: '',
      defaultMessage: 'That task no longer exists.',
    },
  };

  success: Object = {
    completedTasks: {
      occurred: false,
      message: '',
      defaultMessage: 'Amazing job completing that task. Keep it going!',
    },
    taskCreated: {
      occurred: false,
      message: '',
      defaultMessage: 'Your task has been created.',
    },
  };

  varToWordMap = {
    title: 'title',
    dueDate: 'due date',
    newTitle: 'title',
    newDueDate: 'due date',
    newDescription: 'description',
  };

  constructor(
    private ROUTER: Router,
    private TASKS: TaskService,
    private ERROR: ErrorService,
    private UTILS: CommonUtilsService,
    private MESSAGING: MessagingService,
    private STORAGE: LocalStorageService,
    private DRAGULA_SERVICE: DragulaService,
    private QUICK_SETTINGS: QuickSettingsService,
  ) {}

  ngOnInit() {
    // Configure the drag n drop service
    this.DRAGULA_SERVICE.drop.subscribe(value => this.onDrop(value));
    this.toDoInit();
  } // End ngOnInit()

  ngOnDestroy() {
    // Unsubscribe to ensure no memory leaks or duplicate messages
    if (this.UTILS.hasValue(this.taskRowSelectedSubscription)) this.taskRowSelectedSubscription.unsubscribe();
  } // End ngOnDestroy()

  /**
   * Initializes the data in the component by retrieving all
   * the tasks, filtering them into complete and incomplete
   * arrays, and sorting them by how soon they are due
   */
  toDoInit(): void {
    this.newTask = new Task();
    this.completedTasks = [];
    this.incompleteTasks = [];

    // Fetch all the user's tasks
    this.TASKS.getAll()
      .then((tasks: Task[]) => {
        // Filter the tasks into complete and incomplete arrays
        tasks.forEach((task) => {
          if (task.getCompleted()) this.completedTasks.push(task);
          else this.incompleteTasks.push(task);
        });

        this.sortAllTasks();
        this.showBothLists = true;
        this.showCompletedList = true;
        this.showIncompleteList = true;
        this.resetNewTaskFields();
      }) // End then(tasks)
      .catch((getError: RemoteError) => {
        this.handleUnknownError(getError);
        this.taskDatePickerInit();
        this.scrollToTop();
        this.resetNewTaskFields();
      }); // End this.TASKS.getAll()
  } // End toDoInit()

  /**
   * Receives a Dragula event and determines where
   * the event came from and the data it contained
   * @param {any[]} [_eventInfo = []] the drag or drop event from Dragula
   * @return {Object} a JSON containing the ID of the
   * task for the dragged element and where it was dropped
   */
  private getInfoFromDragulaEvent(_eventInfo: any[] = []): Object {
    const taskInfo = {};
    if (_eventInfo.length === 5) {
      const dropDiv = _eventInfo[2] || {};
      const dropDestination: string = dropDiv.id || '';

      const taskDiv = _eventInfo[1] || {};
      const taskId: string = taskDiv.id || '';

      taskInfo['taskId'] = taskId;
      taskInfo['dropDestination'] = dropDestination;
    }

    return taskInfo;
  } // End getInfoFromDragulaEvent()

  /**
   * Handles a drop event from the Dragula service
   * to try and update a task's completed value
   * @param {any[]} [_dropInfo = []] the dragula information from the drop event
   */
  private onDrop(_dropInfo: any[] = []): void {
    // Get the index of the dropped task in the original array and where it was dropped
    const taskInfo: Object = this.getInfoFromDragulaEvent(_dropInfo);

    let tasksSource: Task[];
    let tasksDestination: Task[]
    const destinationIsCompletedList: boolean = taskInfo['dropDestination'] === 'complete';

    if (destinationIsCompletedList) {
      tasksSource = this.incompleteTasks;
      tasksDestination = this.completedTasks;
    } else {
      tasksSource = this.completedTasks;
      tasksDestination = this.incompleteTasks;
    }

    // Find the task object and try to update it
    const taskIndex: number = tasksSource.findIndex(a => a.getId() === taskInfo['taskId']);
    if (taskIndex !== -1) {
      const task: Task = tasksSource[taskIndex];
      this.TASKS.updateCompleted(task.getId(), !task.getCompleted())
        .then(() => {
          // Update the local task object
          task.setCompleted(!task.getCompleted());
          this.disableEditing(task);

          // Remove the task from the array that it was originally in
          tasksSource = tasksSource.splice(taskIndex, 1);

          // Add the task into the right place in the array that it was dropped into
          let insertIndex: number;
          for (insertIndex = 0; insertIndex < tasksDestination.length; insertIndex++) {
            if (task.getDueDate() < tasksDestination[insertIndex].getDueDate()) break;
          }

          tasksDestination.splice(insertIndex, 0, task);
          if (this.isTaskCacheValid() && task.getId() === taskInfo['taskId']) this.clearTaskCache();

          // Refresh the appropriate list
          if (task.getCompleted()) {
            this.displayCompletedListSuccess();
            this.scrollToTop();
          }
        }) // End then()
        .catch((error: RemoteError) => {
          if (this.ERROR.isResourceDneError(error)) {
            if (destinationIsCompletedList) this.displayIncompleteListError(this.errors['taskDoesNotExist']['defaultMessage']);
            else this.displayCompletedListError(this.errors['taskDoesNotExist']['defaultMessage']);

            this.deleteLocalTask(task);
          } else this.handleUnknownError(error);

          this.scrollToTop();
        }); //  End this.TASKS.updateCompleted()
    } else if (destinationIsCompletedList) {
      this.TASKS.sort(this.completedTasks);
      this.refreshCompletedList();
    } else {
      this.TASKS.sort(this.incompleteTasks);
      this.refreshIncompleteList();
    }
  } // End onDrop()

  /**
   * Displays an error within the completed section
   * @param {string} _message the error message to display
   * @param {number} _duration the number of milliseconds for the message
   * to last. If no value is given, the default value will be used
   */
  displayCompletedListError(_message?: string, _duration?: number): void {
    this.errors['completedTasks']['occurred'] = true;
    this.errors['completedTasks']['message'] = _message || this.errors['completedTasks']['defaultMessage'];

    const duration: number = typeof _duration === 'number' ? _duration : this.times['displayMessage'];
    const self = this;
    setTimeout(
      () => {
        self.errors['completedTasks']['occurred'] = false;
        self.errors['completedTasks']['message'] = '';
      },
      duration);
  } // End displayCompletedListError()

  /**
   * Displays an error within the incomplete section
   * @param {string} _message the error message to display
   * @param {number} _duration the number of milliseconds for the message
   * to last. If no value is given, the default value will be used
   */
  displayIncompleteListError(_message?: string, _duration?: number): void {
    this.errors['incompleteTasks']['occurred'] = true;
    this.errors['incompleteTasks']['message'] = _message || this.errors['incompleteTasks']['defaultMessage'];

    const duration: number = typeof _duration === 'number' ? _duration : this.times['displayMessage'];
    const self = this;
    setTimeout(
      () => {
        self.errors['incompleteTasks']['occurred'] = false;
        self.errors['incompleteTasks']['message'] = '';
      },
      duration);
  } // End displayIncompleteListError()

  /**
   * Forces a UI update of both the completed and incomplete sections
   */
  refreshToDoLists(): void {
    this.showBothLists = false;
    const self = this;
    setTimeout(() => self.showBothLists = true, 1);
  } // End refreshToDoLists()

  /**
   * Forces a UI update of the incomplete section
   */
  refreshIncompleteList(): void {
    this.showIncompleteList = false;
    const self = this;
    setTimeout(() => self.showIncompleteList = true, 1);
  } // End refreshIncompleteList()

  /**
   * Forces a UI update of the completed section
   */
  refreshCompletedList(): void {
    this.showCompletedList = false;
    const self = this;
    setTimeout(() => self.showCompletedList = true, 1);
  } // End refreshCompletedList()

  /**
   * Scrolls to a specific HTML element on the page with animation
   * @param {string} [_identifier = ''] the HTML tag
   * identifier for the page element to scroll to
   * @param {number} _duration the number of milliseconds for the animation
   * to last. If no value is given, the default value will be used
   */
  scrollToElement(_identifier: string = '', _duration?: number): void {
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : this.times['scrollDuration'];
    const isClass: boolean = _identifier.charAt(0) === '.';
    if (isClass) $('html, body').animate({ scrollTop: $(_identifier).first().offset().top }, duration);
    else $('html, body').animate({ scrollTop: $(_identifier).offset().top }, duration);
  } // End scrollToElement()

  /**
   * Scrolls to the top of the HTML page with animation
   * @param {number} _duration the number of milliseconds for the animation
   * to last. If no value is given, the default value will be used
   */
  scrollToTop(_duration?: number): void {
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : this.times['scrollDuration'];
    this.scrollToElement('#topOfPage', _duration);
  } // End scrollToTop()

  /**
   * Sends a message to subscribers about the task
   * and row that was chosen in the incomplete section
   * @param {Task} _task the task for the given row that was clicked
   * @param {number} _index the 0-based index representing the row
   * that was clicked on in the row of tasks in the incomplete section
   */
  publishDatePick(_task: Task, _index: number): void {
    this.MESSAGING.publish(new TaskDatePicked(_task, _index));
  } // End publishDatePick

  /**
   * Configures the functions that are called when form elements for the tasks
   * are clicked on. NOTE: Must be called when displaying the date picker
   */
  taskDatePickerInit(): void {
    const self = this;
    $(document).ready(() => {
      // Holds the message that will be received when the date picker for existing tasks is open
      let taskRowMessage;
      const onOpenForExistingTask: Function = () => {
        /*
         * When the date picker opens, subscribe to receive a message
         * about which index was clicked on to open the date picker
         */
        self.taskRowSelectedSubscription = self.MESSAGING.messagesOf(TaskDatePicked)
          .subscribe(message => taskRowMessage = message);
      };

      const onCloseForExistingTask: Function = () => {
        // Unsubscribe to ensure no memory leaks or receiving of old messages
        if (self.UTILS.hasValue(self.taskRowSelectedSubscription)) self.taskRowSelectedSubscription.unsubscribe();
      };

      const onSetForExistingTask: Function = (context) => {
        let index: number;
        let task: Task;

        // Try and get the data from the message that was sent when the date picker was opened
        if (
          self.UTILS.hasValue(taskRowMessage) &&
          self.UTILS.hasValue(taskRowMessage.getIndex()) &&
          self.UTILS.hasValue(taskRowMessage.getTask())
        ) {
          index = taskRowMessage.getIndex();
          task = taskRowMessage.getTask();
        } else {
          index = -1;
          task = null;
        }

        // Check if the user clicked on an actual date, not a range selection
        if (self.UTILS.hasValue(context.select)) {
          if (index !== -1 && self.UTILS.hasValue(task)) {
            // Create a date from the selected day and set the time to 12 pm
            const unixMilliseconds: number = context.select;
            const newDueDate: Date = new Date(unixMilliseconds + self.UTILS.getUnixMilliseconds12Hours());

            // Update the Task's due date because it isn't in a valid format when first created
            if (task.getCompleted()) self.completedTasks[index].setDueDate(newDueDate)
            else self.incompleteTasks[index].setDueDate(newDueDate);
          }
        } else if (context.hasOwnProperty('clear')) {
          // Reset the task's due date in the HTML form
          self.incompleteTasks[index].setDueDate(new Date(self.currentEditingTaskCopy.getDueDateInUnixMilliseconds()));
        }
      };

      const onSetForNewTask: Function = (context) => {
        // Check if the user clicked on an actual date, not a range selection
        if (self.UTILS.hasValue(context.select)) {
          // Create a date from the selected day and set the time to 12 pm
          const unixMilliseconds: number = context.select;
          const newDueDate: Date = new Date(unixMilliseconds + self.UTILS.getUnixMilliseconds12Hours());

          // Update the task's due date because it isn't in a valid format when first created
          self.newTask.setDueDate(newDueDate);
        } else if (context.hasOwnProperty('clear')) {
          self.newTask.setDueDate(null);
        }
      };

      self.existingDatePicker = self.configureDatePicker(
        '.existingTaskDatePicker',
        onOpenForExistingTask,
        onSetForExistingTask,
        onCloseForExistingTask);
      self.newDatePicker = self.configureDatePicker('.newTaskDatePicker', null, onSetForNewTask, null);
      self.existingDatePicker.start();
      self.newDatePicker.start();
    });
  } // End taskDatePickerInit()

  /**
   * Configures a Materialize date picker with standard date
   * options and the option of custom 'on' event functions
   * @param {string} [_identifier = ''] the HTML
   * tag identifier for the date picker element
   * @param {Function} _onOpen a custom onOpen function
   * @param {Function} _onSet a custom onSet
   * function, requires one parameter/argument
   * @param {Function} _onClose a custom onClose function
   * @return {any} the date picker object
   */
  configureDatePicker(_identifier: string = '', _onOpen?: Function, _onSet?: Function, _onClose?: Function): any {
    const datePickerOptions: Object = this.UTILS.generateDefaultDatePickerOptions();

    // Configure custom functions for the open, set, and close events
    datePickerOptions['onOpen'] = _onOpen;
    datePickerOptions['onSet'] = _onSet;
    datePickerOptions['onClose'] = _onClose;

    const jQueryObject = $(_identifier).pickadate(datePickerOptions);
    return jQueryObject.pickadate('picker');
  } // End configureDatePicker()

  /**
   * Refreshes and configures all HTML select elements in the current day modal
   * @param {Task} _task the task that serves as the model
   * for when a specific select input field changes it's value.
   * NOTE: this is only a work around for a current Materialize bug
   */
  refreshSelectElements(_task?: Task): void {
    // $('select').material_select('destroy');
    $('select').material_select();
    $('select').on('change', (changeEvent: any) => {
      // HACK: Subscribe to change events from the select inputs and use their value to update the task model
      if (this.UTILS.hasValue(_task)) _task.setType(changeEvent.currentTarget.selectedOptions[0].value);

      // TODO: The select is not closing when choosing a new option. This needs to be fixed
    });
  } // End refreshSelectElements()

  /**
   * Renitializes all forms for the new task to be created
   */
  resetNewTaskFields(): void {
    this.newTask = new Task();
    $('#createTaskForm').trigger('reset');
    this.taskDatePickerInit();
    this.refreshSelectElements(this.newTask);
  } // End resetNewTaskFields()

  /**
   * Adds a task to the user's tasks by sending a request to the API
   */
  addTask(): void {
    const invalidTitle: boolean = !this.UTILS.hasValue(this.newTask.getTitle()) || this.newTask.getTitle().trim() === '';
    const invalidDueDate: boolean = !this.UTILS.hasValue(this.newTask.getDueDate());

    if (invalidTitle || invalidDueDate) {
      let errorMessage: string = 'Your new task needs a';
      if (invalidTitle && !invalidDueDate) errorMessage = `${errorMessage} title.`;
      else if (invalidDueDate && !invalidTitle) errorMessage = `${errorMessage} due date.`;
      else errorMessage = `${errorMessage} title and due date.`;

      this.displayIncompleteListError(errorMessage, this.times['incompleteListErrorMessage']);
      this.scrollToTop();
    } else {
      this.newTask.setCompleted(false);
      this.TASKS.create(this.newTask)
        .then((newTask: Task) => {
          if (this.errors['incompleteTasks']['occurred']) this.resetIncompleteError();
          if (this.errors['general']['occurred']) this.resetToDoError();

          this.displayCreateTaskSuccess();
          this.scrollToTop();

          // Insert the new task into the correct place in the incomplete tasks
          let insertIndex: number;
          for (insertIndex = 0; insertIndex < this.incompleteTasks.length; insertIndex++) {
            if (newTask.getDueDate() < this.incompleteTasks[insertIndex].getDueDate()) break;
          }

          this.incompleteTasks.splice(insertIndex, 0, newTask);

          // Reset the default task for the form
          this.resetNewTaskFields();
        }) // End then(newTask)
        .catch((createError: Error) => {
          if (this.ERROR.isInvalidRequestError(createError) || createError instanceof LocalError) {
            const invalidParams: string[] = createError.getCustomProperty('invalidParameters') || [];

            let errorMessage: string;
            const length: number = invalidParams.length;
            if (length === 0) errorMessage = 'Your task is invalid.';
            else if (length === 1) errorMessage = `Your task's ${this.varToWordMap[invalidParams[0]]} is invalid.`;
            else {
              const prettyInvalidParams: string[] = invalidParams.map((invalidParam) => {
                let prettyInvalidParam: string;
                if (this.UTILS.hasValue(this.varToWordMap[invalidParam])) prettyInvalidParam = this.varToWordMap[invalidParam];
                else prettyInvalidParam = invalidParam;

                return prettyInvalidParam;
              });

              const invalidParamsSubset: string[] = prettyInvalidParams.slice(0, length - 1);
              const possibleComma: string = length === 2 ? '' : ',';

              /* tslint:disable max-line-length */
              errorMessage = `Your task's ${invalidParamsSubset.join(', ')}${possibleComma} and ${prettyInvalidParams[length - 1]} are invalid.`;
              /* tslint:enable max-line-length */
            }

            this.scrollToTop();
            this.displayIncompleteListError(errorMessage, this.times['incompleteListErrorMessage']);
          } else this.handleUnknownError(createError as RemoteError);
        }); // End this.TASKS.create()
    }
  } // End addTask()

  /**
   * Determines whether or not the type of the tasks
   * should be displayed based on the quick settings value
   * @return {boolean} whether or not to display the task type
   */
  doDisplayTaskType(): boolean {
    return this.QUICK_SETTINGS.getShowType();
  } // End doDisplayTaskType()

  /**
   * Determines whether or not the description of the tasks
   * should be displayed based on the quick settings value
   * @return {boolean} whether or not to display the task description
   */
  doDisplayTaskDescription(): boolean {
    return this.QUICK_SETTINGS.getShowDescription();
  } // End doDisplayTaskDescription();

  /**
   * Sends a request to delete a task through the API
   * @param {Task} _task the task to delete
   */
  deleteRemoteTask(_task: Task): void {
    this.disableEditing(_task);
    this.TASKS.delete(_task.getId())
      .then(() => this.deleteLocalTask(_task))
      .catch((deleteError: RemoteError) => {
        if (this.ERROR.isResourceDneError(deleteError)) {
          if (_task.getCompleted()) this.displayCompletedListError(this.errors['taskDoesNotExist']['defaultMessage']);
          else this.displayIncompleteListError(this.errors['taskDoesNotExist']['defaultMessage']);

          this.deleteLocalTask(_task);
        } else this.handleUnknownError(deleteError);

        this.scrollToTop();
      });
  } // End deleteRemoteTask()

  /**
   * Removes a task from it's respective array
   * based on whether it is completed or incomplete
   * @param {Task} _task the task to delete
   */
  deleteLocalTask(_task: Task): void {
    if (this.UTILS.hasValue(_task)) {
      const tasks: Task[] = _task.getCompleted() ? this.completedTasks : this.incompleteTasks;
      const index: number = tasks.indexOf(_task);
      if (index !== -1) tasks.splice(index, 1);
    }
  } // End deleteLocalTask()

  /**
   * Saves a deep copy of the given task to a class variable,
   * along with the index of that task in the incomplete task list
   * @param {Task} _task the task to cache
   * @param {number} _index the index of the task in the incomplete task list
   */
  cacheTaskState(_task: Task, _index: number): void {
    this.currentEditingTaskCopy = _task.deepCopy();
    this.currentEditingTaskIndex = _index;
  } // End cacheTaskState()

  /**
   * Determines whether or not the current
   * editing task and index have valid values
   * @return {boolean} whether the current editing task and index are value
   */
  isTaskCacheValid(): boolean {
    const taskIndex: number = this.currentEditingTaskIndex;
    const validTask: boolean = this.UTILS.hasValue(this.currentEditingTaskCopy);
    const validIndex: boolean = this.UTILS.hasValue(taskIndex) && taskIndex >= 0 && taskIndex < this.incompleteTasks.length;

    return validTask && validIndex;
  } // End isTaskCacheValid()

  /**
   * Sets the current editing task and index to null
   */
  clearTaskCache(): void {
    this.currentEditingTaskCopy = null;
    this.currentEditingTaskIndex = null;
  } // End clearTaskCache()

  /**
   * Enables a task within the HTML to be edited
   * @param {Task} _task the task to enable editing for
   * @param {number} _index the index of the task in
   * it's respective array (incomplete or complete)
   */
  displayEditableFields(_task: Task, _index: number): void {
    // Check if another task is already being edited
    if (_index !== this.currentEditingTaskIndex) {
      // Check if another task is already being edited
      if (this.isTaskCacheValid()) {
        // Update the UI for that task by disabling any editing
        this.disableEditing(this.incompleteTasks[this.currentEditingTaskIndex]);

        // Undo any edits to that edited task if it's copy was saved
        this.incompleteTasks[this.currentEditingTaskIndex] = this.currentEditingTaskCopy.deepCopy();
      }

      this.cacheTaskState(_task, _index);
      this.enableEditing(_task);
      setTimeout(() => $(`#titleEdit${_index}`).focus(), 1);
    }
  } // End displayEditableFields()

  /**
   * Updates a task's title by making a service request to the
   * API. If the task's title is unchanged, the promise is resolved
   * immediately with a boolean false value. If the request succeeds,
   * the promise is resolved with a string value 'title'. If the request
   * is denied, the promise is rejected with a RemoteError object
   * @param {Task} _oldTask the task object before it was updated
   * (should be a deep copy of _oldTask before any updates were made)
   * @param {Task} _newTask the task
   * to update with all edits already applied
   * @return {Promise<any>} the value indicating success or
   * failure after the service is called to update the task's title
   */
  updateTitle(_oldTask: Task, _newTask: Task): Promise<any> {
    const unchangedTitle: boolean = _newTask.getTitle() === _oldTask.getTitle();

    let promise;
    if (unchangedTitle) promise = Promise.resolve(false);
    else {
      promise = this.TASKS.updateTitle(_newTask.getId(), _newTask.getTitle())
        .then(() => Promise.resolve('title'))
        .catch((updateError: RemoteError) => {
          const updatedUpdateError: RemoteError = this.handleUpdateError(updateError, 'title');
          Promise.reject(updatedUpdateError);
        }); // End this.TASKS.updateTitle()
    }

    return promise;
  } // End updateTitle()

  /**
   * Updates a task's due date by making a service request to the
   * API. If the task's due date is unchanged, the promise is resolved
   * immediately with a boolean false value. If the request succeeds,
   * the promise is resolved with a string value 'dueDate'. If the
   * request is denied, the promise is rejected with a RemoteError object
   * @param {Task} _oldTask the task object before it was updated
   * (should be a deep copy of _oldTask before any updates were made)
   * @param {Task} _newTask the task
   * to update with all edits already applied
   * @return {Promise<any>} the value indicating success or failure
   * after the service is called to update the task's due date
   */
  updateDueDate(_oldTask: Task, _newTask: Task): Promise<any> {
    const unchangedDueDate: boolean = _newTask.getDueDateInUnixMilliseconds() === _oldTask.getDueDateInUnixMilliseconds();

    let promise;
    if (unchangedDueDate) promise = Promise.resolve(false);
    else {
      promise = this.TASKS.updateDueDate(_newTask.getId(), _newTask.getDueDate())
        .then(() => Promise.resolve('dueDate'))
        .catch((updateError: RemoteError) => {
          const updatedUpdateError: RemoteError = this.handleUpdateError(updateError, 'dueDate');
          Promise.reject(updatedUpdateError);
        }); // End this.TASKS.updateDueDate()
    }

    return promise;
  } // End updateDueDate()

  /**
   * Updates a task's type by making a service request to the API. If
   * the task's type is unchanged, the promise is resolved immediately
   * with a boolean false value. If the request succeeds, the
   * promise is resolved with a string value 'type'. If the request
   * is denied, the promise is rejected with a RemoteError object
   * @param {Task} _oldTask the task object before it was updated
   * (should be a deep copy of _newTask before any updates were made)
   * @param {Task} _newTask the task
   * to update with all edits already applied
   * @return {Promise<any>} the value indicating success or
   * failure after the service is called to update the task's type
   */
  updateType(_oldTask: Task, _newTask: Task): Promise<any> {
    const unchangedType: boolean = _newTask.getType() === _oldTask.getType();

    let promise;
    if (unchangedType) promise = Promise.resolve(false);
    else {
      promise = this.TASKS.updateType(_newTask.getId(), _newTask.getType())
        .then(() => Promise.resolve('type'))
        .catch((updateError: RemoteError) => {
          const updatedUpdateError: RemoteError = this.handleUpdateError(updateError, 'type');
          Promise.reject(updatedUpdateError);
        }); // End this.TASKS.updateType()
    }

    return promise;
  } // End updateType()

  /**
   * Updates a task's description by making a service request to the
   * API. If the task's description is unchanged, the promise is resolved
   * immediately with a boolean false value. If the request succeeds,
   * the promise is resolved with a string value 'description'. If the
   * request is denied, the promise is rejected with a RemoteError object
   * @param {Task} _oldTask the task object before it was updated
   * (should be a deep copy of _newTask before any updates were made)
   * @param {Task} _newTask the task
   * to update with all edits already applied
   * @return {Promise<any>} the value indicating success or failure
   * after the service is called to update the task's description
   */
  updateDescription(_oldTask: Task, _newTask: Task): Promise<any> {
    const unchangedDescription: boolean = _newTask.getDescription() === _oldTask.getDescription();

    let promise;
    if (unchangedDescription) promise = Promise.resolve(false);
    else {
      promise = this.TASKS.updateDescription(_newTask.getId(), _newTask.getDescription())
        .then(() => Promise.resolve('description'))
        .catch((updateError: RemoteError) => {
          const updatedUpdateError: RemoteError = this.handleUpdateError(updateError, 'description');
          Promise.reject(updatedUpdateError);
        }); // End this.TASKS.updateDescription()
    }

    return promise;
  } // End updateDescription()

  /**
   * Cancels the editing of a task and resets the task's
   * attributes to what they were before editing began
   * @param {Task} _task the task that was edited
   * @param {number} _index the index of the task in it's respective array
   */
  cancelEditingTask(_task: Task, _index: number): void {
    if (this.isTaskCacheValid()) {
      const oldTask: Task = this.currentEditingTaskCopy.deepCopy();
      this.disableEditing(oldTask);
      this.incompleteTasks[_index] = oldTask;
      this.clearTaskCache();
    }
  } // End cancelEditingTask()

  /**
   * Updates a task's changed attributes by making a service request to the API
   * @param {Assigment} _task the task to update
   * @param {number} _index the index of the task in it's respective array
   */
  updateTask(_task: Task, _index: number): void {
    this.disableEditing(_task);

    const invalidTitle: boolean = !this.UTILS.hasValue(_task.getTitle()) || _task.getTitle().trim() === '';
    const invalidDueDate: boolean = !this.UTILS.hasValue(_task.getDueDate());

    if (invalidTitle || invalidDueDate) {
      let errorMessage: string = 'Your task needs a ';
      if (invalidTitle && !invalidDueDate) errorMessage = `${errorMessage} title.`;
      else if (invalidDueDate && !invalidTitle) errorMessage = `${errorMessage} due date.`;
      else errorMessage = `${errorMessage} title and due date.`;

      // Refresh the current task with the old, cached version
      const oldTask: Task = this.currentEditingTaskCopy.deepCopy();
      this.disableEditing(oldTask);
      this.incompleteTasks[_index] = oldTask;
      this.clearTaskCache();

      this.displayIncompleteListError(errorMessage, this.times['incompleteListErrorMessage']);
      this.scrollToTop();
    } else {
      // Updated fields are validated locally. Create promise variables to hold promises of service requests to update the task
      const updateTitlePromise = this.updateTitle(this.currentEditingTaskCopy, _task);
      const updateDueDatePromise = this.updateDueDate(this.currentEditingTaskCopy, _task);
      const updateTypePromise = this.updateType(this.currentEditingTaskCopy, _task);
      const updateDescriptionPromise = this.updateDescription(this.currentEditingTaskCopy, _task);

      // Execute all the promises and make sure they all finish, even if some get rejected
      const promises = [
        updateTitlePromise.catch(error => error),
        updateDueDatePromise.catch(error => error),
        updateTypePromise.catch(error => error),
        updateDescriptionPromise.catch(error => error),
      ];

      Promise.all(promises).then((resolutions: any[]) => {
        // Determine if there are any errors when the promises are all resolved or rejected
        const errors: RemoteError[] = resolutions.filter(resolution => resolution instanceof RemoteError);
        const unknownErrors: RemoteError[] = errors.filter(error => error.getCustomProperty('unknownError'));

        if (unknownErrors.length > 0) {
          this.handleUnknownError();
          this.scrollToTop();
          this.enableEditing(_task);
          unknownErrors.forEach(unknownError => console.error(unknownError));
        } else if (errors.length > 0) {
          const errorMessages: string[] = errors.map(error => error.getCustomProperty('detailedErrorMessage'));
          const errorMessage: string = `${errorMessages.join('. ')}.`;

          this.displayIncompleteListError(errorMessage, this.times['incompleteListErrorMessage']);
          this.scrollToTop();
          this.enableEditing(_task);
        } else {
          // No errors occurred so reset any previous errors
          this.resetIncompleteError();

          // Check if attributes were actually updated
          const actuallyUpdated: string[] = resolutions.filter(resolution => typeof resolution === 'string');
          if (actuallyUpdated.length > 0) {
            // TODO: Display inline success icon

            // If the due date was updated, re-sort the list
            if (actuallyUpdated.some(attribute => attribute === 'dueDate')) this.TASKS.sort(this.incompleteTasks);
          } else console.log('No task attributes were actually different');

          this.clearTaskCache();
        }
      }) // End then(resolutions)
      .catch(unhandledError => this.handleUnknownError(unhandledError)); // End Promises.all()
    }
  } // End updateTask()

  /**
   * Handles remote errors from the API that
   * are received when an update to a task fails
   * @param {RemoteError} _error the remote error that
   * contains information about why updating the task failed
   * @param {string} [_attribute = 'attribute']
   * the attribute that tried to be updated
   * @return {RemoteError} the same RemoteError object with more
   * detailed information about why the request failed attached
   */
  handleUpdateError(_error: RemoteError, _attribute: string = 'attribute'): RemoteError {
    // Make a shallow copy to avoid using the input argument variable
    const updateError: RemoteError = _error;

    let errorMessage: string;
    let unknownError: boolean = false;
    if (this.ERROR.isInvalidRequestError(updateError)) {
      const unchangedParams: string[] = updateError.getCustomProperty('unchangedParameters') || [];
      const prettyAttribute: string = this.varToWordMap[_attribute] || 'attribute';
      if (unchangedParams.length > 0) errorMessage = `Your task\'s ${prettyAttribute} is unchanged`;
      else unknownError = true;
    } else if (this.ERROR.isResourceDneError(updateError)) errorMessage = this.errors['taskDoesNotExist']['defaultMessage'];
    else unknownError = true;

    if (unknownError) updateError.setCustomProperty('unknownError', true);
    else updateError.setCustomProperty('detailedErrorMessage', errorMessage);

    return updateError;
  } // End handleUpdateError()

  /**
   * Enables editing for any of a task's attributes through the HTML form
   * @param {Task} _task the task to enable editing for
   */
  enableEditing(_task: Task): void {
    if (this.UTILS.hasValue(_task)) {
      _task.setEditModeType(true);
      _task.setEditModeDate(true);
      _task.setEditModeTitle(true);
      _task.setEditModeDescription(true);

      // Initialize the Materialize input elements for the task
      this.taskDatePickerInit();
      this.refreshSelectElements(_task);
    }
  } // End enableEditing()

  /**
   * Disables editing for any of a task's attributes through the HTML form
   * @param {Task} _task the task to disable editing for
   */
  disableEditing(_task: Task): void {
    if (this.UTILS.hasValue(_task) && _task instanceof Task) {
      _task.setEditModeType(false);
      _task.setEditModeDate(false);
      _task.setEditModeTitle(false);
      _task.setEditModeDescription(false);
    }
  } // End disableEditing()

  /**
   * Sorts all tasks, complete and incomplete, by their due date
   */
  sortAllTasks(): void {
    this.TASKS.sort(this.completedTasks);
    this.TASKS.sort(this.incompleteTasks);
  } // End sortAllTasks()

  /**
   * Resets any error in the completed section
   */
  resetCompletedError(): void {
    this.errors['completedTasks']['occurred'] = false
    this.errors['completedTasks']['message'] = '';
  } // End resetCompletedError()

  /**
   * Resets any error in the incomplete section
   */
  resetIncompleteError(): void {
    this.errors['incompleteTasks']['occurred'] = false;
    this.errors['incompleteTasks']['message'] = '';
  } // End resetIncompleteError()

  /**
   * Resets any error at the top
   */
  resetToDoError(): void {
    this.errors['general']['occurred'] = false;
    this.errors['general']['message'] = '';
  } // End resetToDoError()

  /**
   * Resets all errors in the component
   */
  resetAllErrors(): void {
    this.resetToDoError();
    this.resetCompletedError();
    this.resetIncompleteError();
  } // End resetAllErrors()

  /**
   * Resets any message at the top of the incomplete section
   */
  resetCreateTaskMessage(): void {
    this.success['taskCreated']['occurred'] = false;
    this.success['taskCreated']['message'] = '';
  } // End resetCreateTaskMessage()

  /**
   * Resets any message at the top of the completed section
   */
  resetCompleteTaskMessage(): void {
    this.success['completedTasks']['occurred'] = false;
    this.success['completedTasks']['message'] = '';
  } // End resetCompleteTaskMessage()

  /**
   * Displays a success message in the incomplete section
   * @param {string} _message a custom message to display. If no value is
   * passed, the default message for successfully creating a task will be used
   */
  displayCreateTaskSuccess(_message?: string): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : this.success['taskCreated']['defaultMessage'];
    this.success['taskCreated']['occurred'] = true;
    this.success['taskCreated']['message'] = message;
    const self = this;
    setTimeout(() => self.resetCreateTaskMessage(), this.times['displayMessage']);
  } // End displayCreateTaskSuccess()

  /**
   * Displays a success message in the completed section
   * @param {string} _message a custom message to display. If no value is
   * passed, the default message for successfully completing a task will be used
   */
  displayCompletedListSuccess(_message?: string): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : this.success['completedTasks']['defaultMessage'];
    this.success['completedTasks']['occurred'] = true;
    this.success['completedTasks']['message'] = message;
    const self = this;
    setTimeout(() => self.resetCompleteTaskMessage(), this.times['displayMessage']);
  } // End displayCompletedListSuccess()

  /**
   * Handles errors that can't be determined elsewhere and logs the error
   * @param {RemoteError} [_error = new RemoteError()] the unknown error
   */
  private handleUnknownError(_error: RemoteError = new RemoteError()): void {
    console.error(_error);
    if (this.ERROR.isAuthError(_error)) {
      this.STORAGE.deleteItem('token');
      this.STORAGE.deleteItem('currentUser');

      this.STORAGE.setItem('expiredToken', 'true');
      this.ROUTER.navigate(['/login']);
    } else {
      this.errors['general']['occurred'] = true;
      this.errors['general']['message'] = this.errors['general']['defaultMessage'];

      const self = this;
      setTimeout(
        () => {
          self.errors['general']['occurred'] = false;
          self.errors['general']['message'] = '';
        },
        this.times['displayMessage']);
    }
  } // End handleUnknownError()
}
