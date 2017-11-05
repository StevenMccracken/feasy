// Import angular packages
import {
  OnInit,
  Component,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';

// Import 3rd-party libraries
import {
  addDays,
  endOfDay,
  isSameDay,
  startOfDay,
  isSameMonth,
} from 'date-fns';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
} from 'angular-calendar';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

// Import our files
import { Task } from '../../objects/task';
import { Error } from '../../objects/error';
import { COLORS } from '../../objects/colors';
import { LocalError } from '../../objects/local-error';
import { RemoteError } from '../../objects/remote-error';
import { TaskService } from '../../services/task.service';
import { ErrorService } from '../../services/error.service';
import { MessagingService } from '../../services/messaging.service';
import { CommonUtilsService } from '../../utils/common-utils.service';
import { LocalStorageService } from '../../utils/local-storage.service';
import { TaskDatePicked } from '../../objects/messages/task-date-picked';
import { QuickSettingsService } from '../../services/quick-settings.service';
import { QuickAddTasksCreated } from '../../objects/messages/quick-add-tasks-created';
import { QuickSettingsColorToggle } from '../../objects/messages/quick-settings-color-toggle';

declare var $: any;

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['calendar.component.css'],
  templateUrl: 'calendar.component.html',
})

export class CalendarComponent implements OnInit {
  currentEditingTaskIndex: number;
  currentEditingTaskCopy: Task;
  newTask: Task = new Task();

  // Set the default calendar view type to month
  calendarViewType: string = 'month';

  // Holds the tasks for a clicked day
  selectedDayTasks: Task[];

  // Allows calendar to tell which date is being viewed
  viewDate: Date = new Date();
  selectedDayDate: Date;

  // IMPORTANT! USE THIS TO STORE TARGET INTO A VARIABLE TODO: Clarify this comment
  e: any;

  displayEventColors: boolean;

  // Event list for the calendar
  events: CalendarEvent[] = [];

  // Maps that associate a calendar event to a task (and vice versa) based on the task's ID
  taskIdsToTasks: Map<string, Task>;
  eventsToTaskIds: Map<CalendarEvent, string>;
  taskIdsToEvents: Map<string, CalendarEvent>;

  // TODO: verify these
  activeDayIsOpen: boolean = false;
  onetime: boolean = false;
  timer: any;

  // Manages UI updates for the calendar
  calendarState: Subject<any> = new Subject();

  // TODO: Don't think these are necessary
  actions: CalendarEventAction[] = [{
    label: '<i class="material-icons edit">create</i>',
    onClick: ({ event }: { event: CalendarEvent }): void => {
      console.log(event);
    },
  },
  {
    label: '<i class="material-icons delete">delete_sweep</i>',
    onClick: ({ event }: { event: CalendarEvent }): void => {
      console.log(event);
    },
  }];

  // Materialize date-picker holder
  datePicker: any;

  // Subscription used to receive messages about when tasks are added from the Quick Add modal
  quickAddTasksSubscription: Subscription;

  // Subscription used to receive messages about when a date is picked for a task in the selected day list
  taskRowSelectedSubscription: Subscription;

  showColorsSubscription: Subscription;

  // The default amount of time (milliseconds) to display a message for
  defaultMessageDisplayTime: number = 5000;

  // Standard error messages
  errorMessages: Object = {
    unableToCompleteTask: 'Unable to complmete that task right now. Please try again.',
    unableToIncompleteTask: 'Unable to mark that task as incomplete right now. Please try again.',
    taskDoesNotExist: 'That task no longer exists.',
    default: 'Something bad happened. Please try that again or contact us at feasyresponse@gmail.com.to fix this issue.',
  };

  // Standard success messages
  successMessages: Object = {
    updatedTask: 'Your task has been updated.',
    createdTask: 'Your task has been created.',
    updatedTaskDueDate: 'Your task has been updated and the due date has changed.',
  };

  errors: Object = {
    general: {
      occurred: false,
      message: '',
      defaultMessage: this.errorMessages['default'],
    },
    selectedDay: {
      occurred: false,
      message: '',
      defaultMessage: this.errorMessages['default'],
    },
  };

  success: Object = {
    general: {
      occurred: false,
      message: '',
    },
    selectedDay: {
      occurred: false,
      message: '',
    },
  };

  // Mapping of variable names to regular words
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
    private CHANGE_DETECTOR: ChangeDetectorRef,
    private QUICK_SETTINGS: QuickSettingsService,
  ) {}

  ngOnDestroy() {
    // Unsubscribe to ensure no memory leaks
    if (this.UTILS.hasValue(this.quickAddTasksSubscription)) this.quickAddTasksSubscription.unsubscribe();
    if (this.UTILS.hasValue(this.taskRowSelectedSubscription)) this.taskRowSelectedSubscription.unsubscribe();
    if (this.UTILS.hasValue(this.showColorsSubscription)) this.showColorsSubscription.unsubscribe();
  }

  ngOnInit() {
    this.quickAddTasksSubscription = this.MESSAGING.messagesOf(QuickAddTasksCreated)
      .subscribe((quickAddMessage) => {
        if (this.UTILS.hasValue(quickAddMessage)) {
          const newTasks: Task[] = quickAddMessage.getTasks() || [];
          this.populateCalendarWithEvents(newTasks);
          this.refreshCalendar();
        }
      });

    this.showColorsSubscription = this.MESSAGING.messagesOf(QuickSettingsColorToggle)
      .subscribe((showColorsMessage) => {
        if (this.UTILS.hasValue(showColorsMessage)) {
          this.displayEventColors = showColorsMessage.shouldDisplayColors();
          const tasks: Task[] = Array.from(this.taskIdsToTasks.values());
          tasks.forEach(task => this.refreshEventColor(task));

          this.refreshCalendar();
        }
      });

    this.displayEventColors = this.QUICK_SETTINGS.getShowColors();

    // Populate the calendar with the user's tasks
    this.initializeCalendarData();
  } // End ngOnInit()

  // STORES THE TARGET. TODO: verify this
  setEvent(_event: any): void {
    this.e = $(_event.target).hasClass('cal-cell-top') ? _event.target : null;
  }

  /**
   * Gets all tasks from the API and populates the calendar with events
   */
  initializeCalendarData(): void {
    this.events = [];
    this.selectedDayTasks = [];
    this.taskIdsToTasks = new Map<string, Task>();
    this.taskIdsToEvents = new Map<string, CalendarEvent>();
    this.eventsToTaskIds = new Map<CalendarEvent, string>();

    this.TASKS.getAll()
      .then((tasks: Task[]) => {
        this.populateCalendarWithEvents(tasks);
        this.refreshCalendar();
      }) // End then(tasks)
      .catch((getTasksError: RemoteError) => {
        this.handleUnknownError(false, getTasksError);
        this.scrollToCalendarTop();
      }); // End this.TASKS.getAll()
  } // End initializeCalendarData()

  /**
   * Updates a CalendarEvent's color based on a given task's due date
   * @param {Task} _task the task to
   * update the corresponding CalendarEvent for
   */
  refreshEventColor(_task: Task): void {
    const event = this.getEventForTask(_task);
    event.color = this.determineEventColor(_task);
  } // End refreshEventColor()

  /**
   * Refreshes the calendar UI. This should be
   * called when any calendar event data is updated
   */
  refreshCalendar(): void {
    this.calendarState.next();
  } // End refreshCalendar()

  /**
   * Determines the color for a calendar event based on
   * a given task date's relation to the current date
   * @param {Task} _task the task of the CalendarEvent to determine the color for
   * @return {any} JSON of the color attributes
   */
  determineEventColor(_task: Task): any {
    const now = new Date();
    const dueDate = _task.getDueDate();

    /*
     * GRAY: Events that were before the current date. RED: Events that are within
     * 5 days of the current date. YELLOW: Events that are more than 5 days away
     * but less than 14 days from the current date. BLUE: Events that are more
     * than 14 days away from the current date. GREEN: Events that are compmleted.
     */
    let color;
    if (!this.displayEventColors) color = COLORS.LIGHT_BLUE;
    else if (_task.getCompleted()) color = COLORS.GREEN;
    else if (endOfDay(dueDate) < now) color = COLORS.GRAY;
    else if (dueDate >= startOfDay(now) && endOfDay(dueDate) < startOfDay(addDays(now, 5))) color = COLORS.RED;
    else if (dueDate >= startOfDay(addDays(now, 5)) && endOfDay(dueDate) < startOfDay(addDays(now, 14))) color = COLORS.YELLOW;
    else color = COLORS.BLUE;

    return color;
  } // End determineEventColor()

  /**
   * Creates a list of calendar events from a given list of
   * tasks and adds them to the calendar and all data structures
   * @param {Task[]} _tasks the tasks to create calendar events for
   */
  populateCalendarWithEvents(_tasks: Task[]): void {
    _tasks.forEach((task) => {
      const taskId: string = task.getId();
      const event: CalendarEvent = this.createEventForTask(task);

      this.events.push(event);
      this.taskIdsToTasks.set(taskId, task);
      this.taskIdsToEvents.set(taskId, event);
      this.eventsToTaskIds.set(event, taskId);
    });
  } // End populateCalendarWithEvents()

  // TODO: Add formal documentation
  monthEventClick(event: any) {
    this.onetime = !this.onetime;
    const dateClicked: Date = event.day.date;
    if (this.onetime) {
      const selectedDayEvents: CalendarEvent[] = event.day.events;
      this.selectedDayTasks.length = 0;
      selectedDayEvents.forEach((calendarEvent) => {
        const taskId: string = this.eventsToTaskIds.get(calendarEvent);
        const task: Task = this.taskIdsToTasks.get(taskId);
        this.selectedDayTasks.push(task);
      });

      // Display a popup if there is more than one task
      if (this.selectedDayTasks.length !== 0) {
        const self = this;
        this.timer = setTimeout(
          () => {
            self.displayPopUp();
            self.onetime = !self.onetime;
          },
          300);
      } else {
        this.onetime = !this.onetime;
        this.openSelectedDayView(dateClicked);
      }
    } else {
      // User double-clicked on the date
      clearTimeout(this.timer);
      this.openSelectedDayView(dateClicked);
    }
  } // End monthEventClick()

  /**
   * This is used to display the popup shown on the calendar.
   * The first click is used to show a list of events for the day
   * clicked. The second click will show a list of events in a
   * view that allows users to edit or add events. TODO: verify
   */
  displayPopUp(): void {
    if (this.UTILS.hasValue(this.e)) {
      if ($(this.e).is('#popup')) {
        $(this.e).children('.show').css('display', 'inline-block');
        const prev_e = this.e;
        setTimeout(() => $(prev_e).children('.show').css('display', 'none'), 3000);
      } else {
        $(this.e).attr('id', 'popup');
        let data = `<div id='popup' class='popuptext show'>`;
        this.selectedDayTasks.forEach(task => data += `${task.title}<br>`);
        data += '</div>';

        $(this.e).addClass('popup');
        this.e.insertAdjacentHTML('afterbegin', data);
        const prev_e = this.e;

        setTimeout(() => $(prev_e).children('.show').css('display', 'none'), 3000);
      }
    }
  } // End displayPopUp()

  /**
   * Refreshes and configures all HTML select elements in the selected day modal
   * @param {Task} _task the task that serves as the model for
   * when a specific select input field changes it's value. NOTE:
   * this is only a work around for a current Materialize bug
   */
  refreshSelectElements(_task?: Task): void {
    $('select').material_select('destroy');

    const self = this;
    $(document).ready(() => {
      $('select').material_select();
      $('select').on('change', (changeEvent: any) => {
        // HACK: Subscribe to change events from the select inputs and use their value to update the task model
        if (self.UTILS.hasValue(_task)) _task.setType(changeEvent.currentTarget.selectedOptions[0].value);
      });
    });
  } // End refreshSelectElements()

  /**
   * Opens the selected day list modal
   * @param {Date} _selectedDayDate the date to open the selected day modal for
   */
  openSelectedDayView(_selectedDayDate: Date): void {
    this.selectedDayDate = _selectedDayDate;

    this.newTask = new Task();
    this.newTask.setDueDate(_selectedDayDate);

    // Ensure no tasks are displayed as editable at first
    this.selectedDayTasks.forEach(task => this.disableEditing(task));

    this.clearTaskCache();
    this.refreshSelectElements(this.newTask);
    $('#selectedDayModal').modal('open');
  } // End openSelectedDayView()

  /**
   * Sends a message to subscribers about the task
   * and row that was chosen in the selected day list
   * @param {Task} _task the task for the given row that was clicked
   * @param {number} _index the 0-based index representing the row
   * that was clicked on in the row of tasks in the selected day list
   */
  publishDatePick(_task: Task, _index: number): void {
    this.MESSAGING.publish(new TaskDatePicked(_task, _index));
  } // End publishDatePick

  /**
   * Configures the functions that are called when the date
   * picker for a task is clicked on. NOTE: Must be called every
   * time one of the rows in the selected day list is updated
   */
  taskDatePickerInit(): void {
    const self = this;
    $(document).ready(() => {
      // Holds the message that will be received when the date picker for existing tasks is open
      let pickerMessage;
      const onOpen: Function = () => {
        /*
         * When the date picker opens, subscribe to receive a message
         * about which index was clicked on to open the date picker
         */
        self.taskRowSelectedSubscription = self.MESSAGING.messagesOf(TaskDatePicked)
          .subscribe(message => pickerMessage = message);
      };

      const onClose: Function = () => {
        // Unsubscribe to ensure no memory leaks or receiving of old messages
        if (self.UTILS.hasValue(self.taskRowSelectedSubscription)) self.taskRowSelectedSubscription.unsubscribe();
      };

      const onSet: Function = (context) => {
        let index: number = -1;
        let task: Task = null;

        // Try and get the data from the message that was sent when the date picker was opened
        if (
          self.UTILS.hasValue(pickerMessage) &&
          self.UTILS.hasValue(pickerMessage.getIndex()) &&
          self.UTILS.hasValue(pickerMessage.getTask())
        ) {
          task = pickerMessage.getTask();
          index = pickerMessage.getIndex();
        }

        if (index !== -1 && self.UTILS.hasValue(task)) {
          // Check if the user clicked on an actual date, not a range selection
          if (self.UTILS.hasValue(context.select)) {
            // Create a date from the selected day and set the time to 12 pm
            const unixMilliseconds: number = context.select;
            const newDueDate: Date = new Date(unixMilliseconds + self.UTILS.getUnixMilliseconds12Hours());

            // Update the task's due date because it isn't in a valid format when first created
            self.selectedDayTasks[index].setDueDate(newDueDate);
          } else if (context.hasOwnProperty('clear')) {
            // Reset the task's due date in the HTML form
            self.selectedDayTasks[index].setDueDate(new Date(self.currentEditingTaskCopy.getDueDateInUnixMilliseconds()));
          }
        }
      };

      self.datePicker = self.configureDatePicker('.existingTaskDatePicker', onOpen, onSet, onClose);
      self.datePicker.start();
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
   * Determines whether or not the tasks' types should
   * be displayed based on the quick settings value
   * @return {boolean} whether or not to display the task type
   */
  shouldDisplayTaskType(): boolean {
    return this.QUICK_SETTINGS.getShowType();
  } // End shouldDisplayTaskType()

  /**
   * Determines whether or not the tasks' descriptions
   * should be displayed based on the quick settings value
   * @return {boolean} whether or not to display the task description
   */
  shouldDisplayTaskDescription(): boolean {
    return this.QUICK_SETTINGS.getShowDescription();
  } // End shouldDisplayTaskDescription();

  /**
   * Enables a task within the HTML to be edited
   * @param {Task} _task the task to enable editing for
   * @param {number} _index the index of the task in the selected day of tasks
   */
  displayEditableFields(_task: Task, _index: number): void {
    // If the same task was clicked on to edit multiple times, don't do anything
    if (_index !== this.currentEditingTaskIndex) {
      // Check if another task is already being edited
      if (this.isTaskCacheValid()) {
        // Update the UI for that task by disabling any editing
        this.disableEditing(this.selectedDayTasks[this.currentEditingTaskIndex]);

        // Undo any edits to that edited task if it's copy was saved
        const oldTask: Task = this.currentEditingTaskCopy.deepCopy();
        this.taskIdsToTasks.set(oldTask.getId(), oldTask);
        this.selectedDayTasks[this.currentEditingTaskIndex] = oldTask;
      }

      this.cacheTaskState(_task, _index);
      this.enableEditing(_task);
      setTimeout(() => $(`#titleEdit${_index}`).focus(), 1);
    }
  } // End displayEditableFields()

  /**
   * Saves a deep copy of the given task to a class variable,
   * along with the index of that task in the selected day list
   * @param {Task} _task the task to cache
   * @param {number} _index the index of the task in the selected day list
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
    const validIndex: boolean = this.UTILS.hasValue(taskIndex) && taskIndex >= 0 && taskIndex < this.selectedDayTasks.length;

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
   * Cancels the editing of a task and resets the task's
   * attributes to what they were before editing began
   * @param {Task} _task the task that was edited
   * @param {number} _index the index of the task in the selected day list
   */
  cancelEditingTask(_task: Task, _index: number): void {
    if (this.isTaskCacheValid()) {
      const oldTask: Task = this.currentEditingTaskCopy.deepCopy();
      this.taskIdsToTasks.set(oldTask.getId(), oldTask);
      this.selectedDayTasks[_index] = oldTask;
      this.disableEditing(oldTask);
      this.clearTaskCache();
    }
  } // End cancelEditingTask()

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
    if (this.UTILS.hasValue(_task)) {
      _task.setEditModeType(false);
      _task.setEditModeDate(false);
      _task.setEditModeTitle(false);
      _task.setEditModeDescription(false);
    }
  } // End disableEditing()

  /**
   * Gets a task for a given calendar event
   * @param {CalendarEvent} _event the calendar event to get the task for
   * @return {Task} the task associated with the calendar event
   */
  getTaskForEvent(_event: CalendarEvent): Task {
    let task: Task;
    const taskId: string = this.eventsToTaskIds.get(_event);
    if (this.UTILS.hasValue(taskId)) task = this.taskIdsToTasks.get(taskId);

    return task;
  } // End getTaskForEvent()

  /**
   * Gets a calendar event for a given task
   * @param {Task} _task the task to get the calendar event for
   * @return {CalendarEvent} the calendar event associated with the task
   */
  getEventForTask(_task: Task): CalendarEvent {
    return this.taskIdsToEvents.get(_task.getId());
  } // End getEventForTask()

  /**
   * Handles the event of a calendar event being dropped on the
   * calendar. If the drop date is different from the source
   * date of the drag, an API call will be made to update that
   * calendar event task's due date. Otherwise, nothing is updated
   * @param {CalendarEventTimesChangedEvent} _timesChangedEvent the
   * change event with the calendar event and new start and end dates
   */
  eventTimesChanged(_timesChangedEvent: CalendarEventTimesChangedEvent): void {
    const taskForEvent: Task = this.getTaskForEvent(_timesChangedEvent.event);
    if (!isSameDay(taskForEvent.getDueDate(), _timesChangedEvent.newEnd)) {
      this.TASKS.updateDueDate(taskForEvent.getId(), _timesChangedEvent.newEnd)
        .then(() => {
          taskForEvent.setDueDate(new Date(_timesChangedEvent.newEnd.getTime()));
          _timesChangedEvent.event.start = _timesChangedEvent.newEnd;
          _timesChangedEvent.event.end = _timesChangedEvent.newEnd;
          _timesChangedEvent.event.color = this.determineEventColor(taskForEvent);
          this.refreshCalendar();

          this.resetCalendarError();
        }) // End then()
        .catch((updateError: RemoteError) => {
          this.resetCalendarError();
          this.resetCalendarSuccess();

          const updatedUpdateError: RemoteError = this.handleUpdateError(updateError, 'dueDate');
          if (this.ERROR.isResourceDneError(updateError)) {
            this.displayCalendarError(updatedUpdateError.getCustomProperty('detailedErrorMessage'));
            this.scrollToCalendarTop();

            this.deleteLocalTask(taskForEvent);
            this.refreshCalendar();
          } else this.handleUnknownError(false, updatedUpdateError);
        }); // End this.TASKS.updateDueDate()
    }
  } // End eventTimesChanged()

  /**
   * Deletes a task through the API and removes it from
   * all local data structures upon successful deletion
   * @param {Task} _task the task to delete
   * @param {number} _index the index of the task in the selected day list
   */
  deleteRemoteTask(_task: Task, _index: number): void {
    this.disableEditing(_task);
    this.TASKS.delete(_task.getId())
      .then(() => {
        this.deleteLocalTask(_task, _index);
        this.refreshCalendar();
      }) // End then()
      .catch((deleteError: RemoteError) => {
        if (this.ERROR.isResourceDneError(deleteError)) {
          this.displaySelectedDayError(this.errorMessages['taskDoesNotExist']);

          this.deleteLocalTask(_task, _index);
          this.refreshCalendar();
        } else this.handleUnknownError(true, deleteError);

        this.scrollToSelectedDayTop();
      }); // End this.TASKS.delete()
  } // End deleteRemoteTask()

  /**
   * Removes a task and it's associated event from all data structures
   * @param {Task} _task the task to delete
   * @param {number} _index the index of the task in the selected day list
   */
  deleteLocalTask(_task: Task, _index: number = -1): void {
    if (_index !== -1) this.selectedDayTasks.splice(_index, 1);

    const event: CalendarEvent = this.getEventForTask(_task);
    this.eventsToTaskIds.delete(event);
    this.taskIdsToEvents.delete(_task.getId());

    this.taskIdsToTasks.delete(_task.getId());

    const eventIndex: number = this.events.findIndex(anEvent => anEvent === event);
    if (eventIndex !== -1) this.events.splice(eventIndex, 1);
  } // End deleteLocalTask()

  /**
   * Updates a task's completed attribute through
   * the API to the opposite of what it currently is
   * @param {Task} _task the task to update
   * @param {number} _index the index of the task in the selected day list
   */
  updateCompleted(_task: Task, _index: number): void {
    const newCompletedValue: boolean = !_task.getCompleted();
    this.TASKS.updateCompleted(_task.getId(), newCompletedValue)
      .then(() => {
        _task.setCompleted(newCompletedValue);

        // Update the cached edited copy completed value if it's the same as the actual updated task
        if (this.isTaskCacheValid() && this.currentEditingTaskCopy.getId() === _task.getId()) {
          this.currentEditingTaskCopy.setCompleted(newCompletedValue);
        }

        this.refreshEventColor(_task);
        this.refreshCalendar();
      }) // End then()
      .catch((updateError: RemoteError) => {
        if (this.ERROR.isResourceDneError(updateError)) {
          this.displaySelectedDayError(this.errorMessages['taskDoesNotExist']);
          this.deleteLocalTask(_task, _index);
          this.refreshCalendar();
        } else this.handleUnknownError(true, updateError);

        this.scrollToSelectedDayTop();
      }); // End this.TASKS.updateCompleted()
  } // End updateCompleted()

  /**
   * Updates a task's title by making a service request to the
   * API. If the task's title is unchanged, the promise is resolved
   * immediately with a boolean false value. If the request succeeds,
   * the promise is resolved with a string value 'title'. If the request
   * is denied, the promise is rejected with a RemoteError object
   * @param {Task} _oldTask the task before it was updated
   * (should be a deep copy of _newTask before any updates were made)
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
   * @param {Task} _oldTask the task before it was updated
   * (should be a deep copy of _newTask before any updates were made)
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
   * @param {Task} _oldTask the task before it was updated
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
   * @param {Task} _oldTask the task before it was updated
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
   * Updates a task's changed attributes by making a service request to the API
   * @param {Assigment} _task the task to update
   * @param {number} _index the index of the task in the selected day list
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
      this.clearTaskCache();

      this.disableEditing(oldTask);
      this.selectedDayTasks[_index] = oldTask;
      this.taskIdsToTasks.set(oldTask.getId(), oldTask);

      this.displaySelectedDayError(errorMessage);
      this.scrollToSelectedDayTop();
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
          this.handleUnknownError(true);
          this.scrollToSelectedDayTop();
          this.enableEditing(_task);
          unknownErrors.forEach(unknownError => console.error(unknownError));
        } else if (errors.length > 0) {
          const errorMessages: string[] = errors.map(error => error.getCustomProperty('detailedErrorMessage'));
          const errorMessage: string = `${errorMessages.join('. ')}.`;

          this.displaySelectedDayError(errorMessage);
          this.scrollToSelectedDayTop();
          this.enableEditing(_task);
        } else {
          // No errors occurred so reset any previous errors
          this.resetSelectedDayError();

          // Check if attributes were actually updated
          const actuallyUpdated: string[] = resolutions.filter(resolution => typeof resolution === 'string');
          if (actuallyUpdated.length > 0) {
            // TODO: Display inline success icon

            // If the due date was updated, remove it from the selected day list
            if (actuallyUpdated.some(attribute => attribute === 'dueDate')) {
              this.selectedDayTasks.splice(_index, 1);
              this.displaySelectedDaySuccess(this.successMessages['updatedTaskDueDate']);
              this.scrollToSelectedDayTop();

              const event: CalendarEvent = this.getEventForTask(_task);
              event.start = _task.getDueDate();
              event.end = _task.getDueDate();
              event.color = this.determineEventColor(_task);

              this.refreshCalendar();
            }
          } else console.log('No task attributes were actually different');

          this.clearTaskCache();
        }
      }) // End then(resolutions)
      .catch(unhandledError => this.handleUnknownError(true, unhandledError)); // End Promises.all()
    }
  } // End updateTask()

  /**
   * Scrolls to the top of the selected day modal window with animation
   * @param {number} _duration the number of
   * milliseconds for the duration of the animation
   */
  scrollToSelectedDayTop(_duration?: number): void {
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : 375;
    $('#selectedDayModalTop').animate({ scrollTop: 0 }, duration);
  } // End scrollToSelectedDayTop()

  /**
   * Scrolls to the top of the calendar section with animation
   * @param {number} _duration the number of milliseconds
   * for the duration of the animation. If no value is
   * given, the default value of 375 milliseconds is used
   */
  scrollToCalendarTop(_duration?: number): void {
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : 375;
    this.scrollToElement('#topOfPage', _duration);
  }

  // TODO: verify
  dayEventClick(_event: any): void {
    console.log(_event);
    this.newTask.dueDate = _event.date;
    this.openModal('#createTasks');
    this.datePicker.set('select', _event.date);
  }

  /**
   * Creates a task through the API for the given new task
   * form in the selected day list modal. The task is added
   * to the selected day list and set of calendar events
   */
  createTask(): void {
    // Create a date from the selected day modal view and set the time to 12 pm for the new task
    const dueDate = new Date(this.selectedDayDate.getTime());
    dueDate.setHours(12, 0, 0, 0);
    this.newTask.setDueDate(dueDate);

    this.TASKS.create(this.newTask)
      .then((newTask: Task) => {
        this.displaySelectedDaySuccess(this.successMessages['createdTask']);
        this.scrollToSelectedDayTop();

        // Reset the new task form
        this.newTask = new Task();
        this.refreshSelectElements(this.newTask);

        this.selectedDayTasks.push(newTask);
        this.addCalendarEvent(newTask);
        this.refreshCalendar();
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

          this.scrollToSelectedDayTop();
          this.displaySelectedDayError(errorMessage);
        } else this.handleUnknownError(true, createError as RemoteError);
      }); // End this.TASKS.create()
  } // End createTask()

  /**
   * Adds a task to the calendar events and all data structures
   * @param {Task} _task the task to create the calendar event for
   */
  addCalendarEvent(_task: Task): void {
    const taskId: string = _task.getId();
    const calendarEvent: CalendarEvent = this.createEventForTask(_task);

    this.events.push(calendarEvent);
    this.taskIdsToTasks.set(taskId, _task);
    this.taskIdsToEvents.set(taskId, calendarEvent);
    this.eventsToTaskIds.set(calendarEvent, taskId);
  } // End addCalendarEvent()

  /**
   * Generates a standard CalendarEvent object for a given task
   * @param {Task} _task the task used to determine the
   * title, start/end date, and color of the calendar event
   * @return {CalendarEvent} the calendar event corresponding to the given task
   */
  createEventForTask(_task: Task): CalendarEvent {
    const calendarEvent: CalendarEvent = {
      title: _task.getTitle(),
      start: _task.getDueDate(),
      end: _task.getDueDate(),
      color: this.determineEventColor(_task),
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      actions: this.actions,
    };

    return calendarEvent;
  } // End createEventForTask()

  // TODO: verify
  openModal(_id: string): void {
    console.log('openModal');
    console.log(_id);
    $(_id).modal('open');
  }

  // TODO: Is this necessary?
  handleEvent(action: string, event: CalendarEvent): void {
    console.log('handleEvent');
    console.log({ action, event });
  }

  // TODO: verify
  dayClicked({ date, events }: { date: Date, events: CalendarEvent[] }): void {
    console.log('dayClicked');
    console.log({ date, events });
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  /**
   * Scrolls to a specific HTML element on the page with animation
   * @param {string} [_identifier = ''] the HTML tag
   * identifier for the page element to scroll to
   * @param {number} _duration the number of
   * milliseconds for the animation to last
   */
  scrollToElement(_identifier: string = '', _duration?: number): void {
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : 250;
    const isClass: boolean = _identifier.charAt(0) === '.';

    const element = isClass ? $(_identifier).first() : $(_identifier);
    $('html, body').animate({ scrollTop: element.offset().top }, duration);
  } // End scrollToElement()

  /**
   * Resets any error in the calendar section
   */
  resetCalendarError(): void {
    this.errors['general']['occurred'] = false
    this.errors['general']['message'] = '';
    this.CHANGE_DETECTOR.detectChanges();
  } // End resetCalendarError()

  /**
   * Resets any error in the selected day modal section
   */
  resetSelectedDayError(): void {
    this.errors['selectedDay']['occurred'] = false;
    this.errors['selectedDay']['message'] = '';
    this.CHANGE_DETECTOR.detectChanges();
  } // End resetSelectedDayError()

  /**
   * Resets any success message at the top of the selected day modal section
   */
  resetSelectedDaySuccess(): void {
    this.success['selectedDay']['occurred'] = false;
    this.success['selectedDay']['message'] = '';
    this.CHANGE_DETECTOR.detectChanges();
  } // End resetSelectedDaySuccess()

  /**
   * Resets any success message at the top of the calendar section
   */
  resetCalendarSuccess(): void {
    this.success['general']['occurred'] = false;
    this.success['general']['message'] = '';
    this.CHANGE_DETECTOR.detectChanges();
  } // End resetCalendarSuccess()

  /**
   * Displays a success message in the selected day modal section
   * @param {string} _message a custom message to display. If no value is
   * passed, the default message for the selected day modal will be used
   */
  displaySelectedDaySuccess(_message?: string): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : '';
    this.success['selectedDay']['occurred'] = true;
    this.success['selectedDay']['message'] = _message;

    const self = this;
    setTimeout(() => self.resetSelectedDaySuccess(), this.defaultMessageDisplayTime);
  } // End displaySelectedDaySuccess()

  /**
   * Displays an error message in the selected day modal section
   * @param {string} _message a custom message to display. If no value is
   * passed, the default error message for creating a task will be used
   */
  displaySelectedDayError(_message?: string): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : this.errors['selectedDay']['defaultMessage'];
    this.errors['selectedDay']['occurred'] = true;
    this.errors['selectedDay']['message'] = message;

    const self = this;
    setTimeout(() => self.resetSelectedDayError(), this.defaultMessageDisplayTime);
  } // End displaySelectedDayError()

  /**
   * Displays an error message in the calendar section
   * @param {string} _message a custom message to display. If no value is
   * passed, the default error message for updating a task will be used
   */
  displayCalendarError(_message?: string): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : this.errors['general']['defaultMessage'];
    this.errors['general']['occurred'] = true;
    this.errors['general']['message'] = message;

    const self = this;
    setTimeout(() => self.resetCalendarError(), this.defaultMessageDisplayTime);
  } // End displayCalendarError()

  /**
   * Displays a success message in the calendar section
   * @param {string} _message a custom message to display. If no value is
   * passed, the default message for successfully updating a task will be used
   */
  displayCalendarSuccess(_message?: string): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : this.successMessages['updatedTask'];
    this.success['general']['occurred'] = true;
    this.success['general']['message'] = message;

    const self = this;
    setTimeout(() => self.resetCalendarSuccess(), this.defaultMessageDisplayTime);
  } // End displayCalendarSuccess()

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
      if (unchangedParams.length > 0) errorMessage = `Your task's ${prettyAttribute} is unchanged`;
      else unknownError = true;
    } else if (this.ERROR.isResourceDneError(updateError)) errorMessage = this.errorMessages['taskDoesNotExist'];
    else unknownError = true;

    if (unknownError) updateError.setCustomProperty('unknownError', true);
    else updateError.setCustomProperty('detailedErrorMessage', errorMessage);

    return updateError;
  } // End handleUpdateError()

  /**
   * Handles errors that can't be determined elsewhere and logs the error
   * @param {boolean} _isForSelectedDayModal whether or not the
   * unknown error is for the selected day modal or calendar section
   * @param {RemoteError} [_error = new RemoteError()] the unknown error
   */
  private handleUnknownError(_isForSelectedDayModal: boolean, _error: RemoteError = new RemoteError()): void {
    console.error(_error);
    if (this.ERROR.isAuthError(_error)) {
      this.STORAGE.deleteItem('token');
      this.STORAGE.deleteItem('currentUser');

      this.STORAGE.setItem('expiredToken', 'true');
      this.ROUTER.navigate(['/login']);
    } else if (_isForSelectedDayModal) {
        this.displaySelectedDayError(this.errors['selectedDay']['defaultMessage']);
        this.scrollToSelectedDayTop();
    } else {
      this.displayCalendarError(this.errors['general']['defaultMessage']);
      this.scrollToCalendarTop();
    }
  } // End handleUnknownError()
}
