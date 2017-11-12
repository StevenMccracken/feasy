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
import { FeasyCalendarEvent } from '../../objects/feasy-calendar-event';
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
  CalendarViewTypes = {
    WEEK: 'week',
    MONTH: 'month',
  };

  currentEditingTaskIndex: number;
  currentEditingTaskCopy: Task;
  newTask: Task = new Task();

  // Set the default calendar view type to week
  calendarViewType: string;

  // Allows calendar to tell which date is being viewed
  viewDate: Date = new Date();
  selectedDayDate: Date;

  // Stores the HTML target when the user clicks on a day in the calendar month view
  monthViewDayClickEventTarget: any;

  /*
   * Determines whether or not events should display different colors
   * based on their task's due date, or all just show the same color
   */
  displayEventColors: boolean;

  // Event list for the calendar
  events: FeasyCalendarEvent[] = [];
  selectedDayEvents: FeasyCalendarEvent[];

  // Used to determine whether a day in the month view was single or double clicked
  dayWasClickedOnce: boolean = false;

  // The timer ID used to detect a double-click on a month view day click
  monthViewDayClickTimer: number;

  // Manages UI updates for the calendar
  calendarState: Subject<any> = new Subject();

  // Materialize date-picker holder
  datePicker: any;

  // Subscription used to receive messages about when tasks are added from the Quick Add modal
  quickAddTasksSubscription: Subscription;

  // Subscription used to receive messages about when a date is picked for a task in the selected day list
  taskRowSelectedSubscription: Subscription;

  // Subscription used to receive messages about when the quick setting Show Colors is toggled on or off
  showColorsSubscription: Subscription;

  // Contains the correct widths for certain HTML elements
  correctWidths: any = {
    description: 0,
    previousWindow: 0,
  };

  private times: Object = {
    displayMessage: 5000,
    popupDelay: 300,
    displayPopup: 3000,
    scrollDuration: 375,
  };

  // Amount of days that indicate the status of a task in terms of it's due date
  maxDaysAway: Object = {
    urgent: 5,
    warning: 14,
  };

  // Standard error messages
  errorMessages: Object = {
    invalidNewTaskTitle: 'Your new task needs a title.',
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
  } // End ngOnDestroy()

  ngOnInit() {
    this.calendarViewType = this.QUICK_SETTINGS.getDefaultCalendarViewIsWeek() ? this.CalendarViewTypes.WEEK : this.CalendarViewTypes.MONTH;
    this.quickAddTasksSubscription = this.MESSAGING.messagesOf(QuickAddTasksCreated)
      .subscribe((quickAddMessage) => {
        if (this.UTILS.hasValue(quickAddMessage)) {
          const newTasks: Task[] = quickAddMessage.getTasks() || [];
          this.addTasksToCalendar(newTasks);
          this.refreshCalendar();
        }
      });

    this.showColorsSubscription = this.MESSAGING.messagesOf(QuickSettingsColorToggle)
      .subscribe((showColorsMessage) => {
        if (this.UTILS.hasValue(showColorsMessage)) {
          this.displayEventColors = showColorsMessage.shouldDisplayColors();
          this.events.forEach(event => this.refreshEventColor(event));
          this.refreshCalendar();
        }
      });

    this.displayEventColors = this.QUICK_SETTINGS.getShowColors();

    // Populate the calendar with the user's tasks
    this.initializeCalendarData();

    // Capture left and right arrow presses to move the calendar view forwards and backwards
    const self = this;
    document.onkeydown = (_event) => {
      const keyPress: any = _event || window.event;
      const dateAdjustment: number = self.calendarViewType === self.CalendarViewTypes.WEEK ? 7 : 30;
      switch (keyPress.key) {
        case 'ArrowLeft':
          self.viewDate = addDays(self.viewDate, -dateAdjustment);
          this.refreshCalendar();
          break;
        case 'ArrowRight':
          self.viewDate = addDays(self.viewDate, dateAdjustment);
          this.refreshCalendar();
          break;
        default:
      }
    };

    // Listen for window resizing events
    window.addEventListener('resize', (_event) => {
      // Only update the width of the input boxes when the selected day modal is open and the window is horizontally resized
      const source: any = _event.srcElement || _event.currentTarget;
      if ($('#selectedDayModal').is(':visible') && source.innerWidth !== self.correctWidths.previousWindow) {
        self.correctWidths.previousWindow = source.innerWidth;
        self.correctWidths.description = self.getCorrectDescriptionWidth();
        self.CHANGE_DETECTOR.detectChanges();
      }
    });
  } // End ngOnInit()

  /**
   * Captures a click event on a day in the month
   * view and saves the click event's target
   * @param {MouseEvent} _clickEvent the mouse
   * click event for the day that was clicked on
   */
  setEvent(_clickEvent: MouseEvent): void {
    this.monthViewDayClickEventTarget = $(_clickEvent.target).hasClass('cal-cell-top') ? _clickEvent.target : null;
  }

  /**
   * Returns the correct width that the description
   * text field should be when it is not being edited
   * @return {number} the correct width
   */
  getCorrectDescriptionWidth(): number {
    return $('#task-creation').width() * 0.95972614;
  } // End getCorrectDescriptionWidth()

  /**
   * Gets all tasks from the API and populates the calendar with events
   */
  initializeCalendarData(): void {
    this.events = [];
    this.selectedDayEvents = [];

    this.TASKS.getAll()
      .then((tasks: Task[]) => {
        this.addTasksToCalendar(tasks);
        this.refreshCalendar();
      }) // End then(tasks)
      .catch((getTasksError: RemoteError) => {
        this.handleUnknownError(false, getTasksError);
        this.scrollToCalendarTop();
      }); // End this.TASKS.getAll()
  } // End initializeCalendarData()

  /**
   * Updates an event's color based on it's task's due date
   * @param {FeasyCalendarEvent} _event the event to update
   */
  refreshEventColor(_event: FeasyCalendarEvent): void {
    const color: any = this.determineEventColor(_event.getTask());
    _event.setColor(color);
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
   * @param {Task} _task the task of the event to determine the color for
   * @return {any} JSON of the color attributes
   */
  determineEventColor(_task: Task): any {
    const now = new Date();
    const dueDate = _task.getDueDate();
    const daysAwayUrgent: number = this.maxDaysAway['urgent'];
    const daysAwayWarning: number = this.maxDaysAway['warning'];

    let color;
    if (!this.displayEventColors) color = COLORS.LIGHT_BLUE;
    else if (_task.getCompleted()) color = COLORS.GREEN;
    else if (endOfDay(dueDate) < now) color = COLORS.GRAY;
    else if (
      dueDate >= startOfDay(now) &&
      endOfDay(dueDate) < startOfDay(addDays(now, daysAwayUrgent))
    ) {
      color = COLORS.RED;
    } else if (
      dueDate >= startOfDay(addDays(now, daysAwayUrgent)) &&
      endOfDay(dueDate) < startOfDay(addDays(now, daysAwayWarning))
    ) {
      color = COLORS.YELLOW;
    } else color = COLORS.BLUE;

    return color;
  } // End determineEventColor()

  /**
   * Creates a list of calendar events from a given list of
   * tasks and adds them to the calendar and all data structures
   * @param {Task[]} _tasks the tasks to create calendar events for
   */
  addTasksToCalendar(_tasks: Task[]): void {
    _tasks.forEach(task => this.addCalendarEvent(task));
  } // End addTasksToCalendar()

  /**
   * Occurs when a day is clicked on in the month view. Determines
   * whether to display the popup of events or the full modal
   * @param {any} _clickEvent the calendar click event
   */
  monthViewDayClicked(_clickEvent: any): void {
    const dateClicked: Date = _clickEvent.day.date;
    this.dayWasClickedOnce = !this.dayWasClickedOnce;

    // Check if the user single or double clicked
    if (this.dayWasClickedOnce) {
      // Get the events for the day that was clicked on
      const selectedDayEvents: FeasyCalendarEvent[] = _clickEvent.day.events;

      // Refresh the list of selected day tasks with the events for the day that was clicked on
      this.selectedDayEvents.length = 0;
      selectedDayEvents.forEach(event => this.selectedDayEvents.push(event));

      // Display a popup if there is more than one task
      if (this.selectedDayEvents.length > 0) {
        const self = this;
        this.monthViewDayClickTimer = window.setTimeout(
          () => {
            self.displayMonthViewPopup();
            self.dayWasClickedOnce = !self.dayWasClickedOnce;
          },
          this.times['popupDelay']);
      } else {
        this.dayWasClickedOnce = !this.dayWasClickedOnce;
        this.openSelectedDayView(dateClicked);
      }
    } else {
      clearTimeout(this.monthViewDayClickTimer);
      this.openSelectedDayView(dateClicked);
    }
  } // End monthViewDayClicked()

  /**
   * Displays a popup containing event titles above the
   * day that was clicked on in the month view calendar
   */
  displayMonthViewPopup(): void {
    // Check if the target was saved
    if (this.UTILS.hasValue(this.monthViewDayClickEventTarget)) {
      if ($(this.monthViewDayClickEventTarget).is('#popup')) {
        // Show the popup again if it is already displayed
        $(this.monthViewDayClickEventTarget).children('.show').css('display', 'inline-block');
      } else {
        // Update the popup text with the new day's evets
        $(this.monthViewDayClickEventTarget).attr('id', 'popup');
        let data: string = `<div id='popup' class='popuptext show'>`;
        this.selectedDayEvents.forEach(event => data += `${event.getTask().getTitle()}<br>`);
        data += '</div>';

        $(this.monthViewDayClickEventTarget).addClass('popup');
        this.monthViewDayClickEventTarget.insertAdjacentHTML('afterbegin', data);
      }

      const previousTarget: any = this.monthViewDayClickEventTarget;
      setTimeout(() => $(previousTarget).children('.show').css('display', 'none'), this.times['displayPopup']);
    }
  } // End displayMonthViewPopup()

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

    // Ensure no events are displayed as editable at first
    this.selectedDayEvents.forEach(event => this.disableEditing(event));

    this.clearTaskCache();
    this.refreshSelectElements(this.newTask);
    $('#selectedDayModal').modal('open');

    // Make sure the widths are up to date when the modal opens
    this.correctWidths.previousWindow = document.documentElement.clientWidth;
    this.correctWidths.description = this.getCorrectDescriptionWidth();

    this.resetSelectedDayError();
    this.resetSelectedDaySuccess();
  } // End openSelectedDayView()

  /**
   * Sends a message to subscribers about the event's
   * task and row that was chosen in the selected day list
   * @param {FeasyCalendarEvent} _event the
   * event for the given row that was clicked
   * @param {number} _index the 0-based index representing the row
   * that was clicked on in the row of events in the selected day list
   */
  publishDatePick(_event: FeasyCalendarEvent, _index: number): void {
    this.MESSAGING.publish(new TaskDatePicked(_event.getTask(), _index));
  } // End publishDatePick()

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
        let task: Task = null;
        let index: number = -1;

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
            self.selectedDayEvents[index].getTask().setDueDate(newDueDate);
          } else if (context.hasOwnProperty('clear')) {
            // Reset the task's due date in the HTML form
            self.selectedDayEvents[index].getTask().setDueDate(new Date(self.currentEditingTaskCopy.getDueDateInUnixMilliseconds()));
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
   * @param {FeasyCalendarEvent} _event the event to enable editing for
   * @param {number} _index the index of the evnet in the selected day of events
   */
  displayEditableFields(_event: FeasyCalendarEvent, _index: number): void {
    // If the same task was clicked on to edit multiple times, don't do anything
    if (_index !== this.currentEditingTaskIndex) {
      // Check if another task is already being edited
      if (this.isTaskCacheValid()) {
        // Update the UI for that event by disabling any editing
        this.disableEditing(this.selectedDayEvents[this.currentEditingTaskIndex]);

        // Undo any edits to that edited task if it's copy was saved
        const oldTask: Task = this.currentEditingTaskCopy.deepCopy();
        this.selectedDayEvents[this.currentEditingTaskIndex].setTask(oldTask);
      }

      this.cacheTaskState(_event, _index);
      this.enableEditing(_event);
      setTimeout(() => $(`#titleEdit${_index}`).focus(), 1);
    }
  } // End displayEditableFields()

  /**
   * Saves a deep copy of a given event's task to a class variable,
   * along with the index of that event in the selected day list
   * @param {FeasyCalendarEvent} _event the event containing the task to cache
   * @param {number} _index the index of the event in the selected day list
   */
  cacheTaskState(_event: FeasyCalendarEvent, _index: number): void {
    this.currentEditingTaskCopy = _event.getTask().deepCopy();
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
    const validIndex: boolean = this.UTILS.hasValue(taskIndex) && taskIndex >= 0 && taskIndex < this.selectedDayEvents.length;

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
   * Cancels the edits of the current event being edited and resets
   * the event's attributes to what they were before editing began
   * @param {FeasyCalendarEvent} _event the event to cancel the editing for
   * @param {number} _index the index of the event in the selected day list
   */
  cancelEditing(_event: FeasyCalendarEvent, _index: number): void {
    if (this.isTaskCacheValid()) {
      const oldTask: Task = this.currentEditingTaskCopy.deepCopy();
      _event.setTask(oldTask);
      this.disableEditing(_event);
      this.clearTaskCache();
    }
  } // End cancelEditing()

  /**
   * Enables editing for any of an event's task's attributes through the HTML form
   * @param {FeasyCalendarEvent} _event the event to enable editing for
   */
  enableEditing(_event: FeasyCalendarEvent): void {
    const task: Task = _event.getTask();
    task.setEditModeType(true);
    task.setEditModeDate(true);
    task.setEditModeTitle(true);
    task.setEditModeDescription(true);

    // Initialize the Materialize input elements for the task
    this.taskDatePickerInit();
    this.refreshSelectElements(task);
  } // End enableEditing()

  /**
   * Disables editing for all of an event's
   * task's attributes through the HTML form
   * @param {FeasyCalendarEvent} _event the event to disable editing for
   */
  disableEditing(_event: FeasyCalendarEvent): void {
    const task: Task = _event.getTask();
    task.setEditModeType(false);
    task.setEditModeDate(false);
    task.setEditModeTitle(false);
    task.setEditModeDescription(false);
  } // End disableEditing()

  /**
   * Handles the event of a calendar event being dropped on the calendar. If the
   * drop date is different from the source date of the drag, an API call will
   * be made to update that event task's due date. Otherwise, nothing is updated
   * @param {CalendarEventTimesChangedEvent} _timesChangedEvent
   * the change event with the event and new start and end dates
   */
  eventTimesWereChanged(_timesChangedEvent: CalendarEventTimesChangedEvent): void {
    const event: FeasyCalendarEvent = _timesChangedEvent.event as FeasyCalendarEvent;
    const task: Task = event.getTask();

    if (!isSameDay(task.getDueDate(), _timesChangedEvent.newEnd)) {
      this.TASKS.updateDueDate(task.getId(), _timesChangedEvent.newEnd)
        .then(() => {
          task.setDueDate(new Date(_timesChangedEvent.newEnd.getTime()));
          event.start = _timesChangedEvent.newStart;
          event.end = _timesChangedEvent.newEnd;
          this.refreshEventColor(event);
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

            this.deleteLocalEvent(event);
            this.refreshCalendar();
          } else this.handleUnknownError(false, updatedUpdateError);
        }); // End this.TASKS.updateDueDate()
    }
  } // End eventTimesWereChanged()

  /**
   * Deletes an event's task through the API and removes it
   * from all local data structures upon successful deletion
   * @param {FeasyCalendarEvent} _event the event to delete
   * @param {number} _index the index of the event in the selected day list
   */
  deleteRemoteTask(_event: FeasyCalendarEvent, _index: number): void {
    this.disableEditing(_event);
    this.TASKS.delete(_event.getTask().getId())
      .then(() => {
        this.deleteLocalEvent(_event, _index);
        this.refreshCalendar();
      }) // End then()
      .catch((deleteError: RemoteError) => {
        if (this.ERROR.isResourceDneError(deleteError)) {
          this.displaySelectedDayError(this.errorMessages['taskDoesNotExist']);

          this.deleteLocalEvent(_event, _index);
          this.refreshCalendar();
        } else this.handleUnknownError(true, deleteError);

        this.scrollToSelectedDayTop();
      }); // End this.TASKS.delete()
  } // End deleteRemoteTask()

  /**
   * Removes an event from memory
   * @param {FeasyCalendarEvent} _event the event to delete
   * @param {number} _index the index of the event
   * in the selected day list, if it exists there
   */
  deleteLocalEvent(_event: FeasyCalendarEvent, _index: number = -1): void {
    if (_index !== -1) this.selectedDayEvents.splice(_index, 1);

    const eventIndex: number = this.events.findIndex(event => event === _event);
    if (eventIndex !== -1) this.events.splice(eventIndex, 1);
  } // End deleteLocalEvent()

  /**
   * Updates a event's task's completed attribute through
   * the API to the opposite of what it currently is
   * @param {FeasyCalendarEvent} _event the event to update
   * @param {number} _index the index of the event in the selected day list
   */
  updateCompleted(_event: FeasyCalendarEvent, _index: number): void {
    const task: Task = _event.getTask();
    const newCompletedValue: boolean = !task.getCompleted();
    this.TASKS.updateCompleted(task.getId(), newCompletedValue)
      .then(() => {
        task.setCompleted(newCompletedValue);

        // Update the cached edited copy completed value if it's the same as the actual updated task
        if (this.isTaskCacheValid() && this.currentEditingTaskCopy.getId() === task.getId()) {
          this.currentEditingTaskCopy.setCompleted(newCompletedValue);
        }

        this.refreshEventColor(_event);
        this.refreshCalendar();
      }) // End then()
      .catch((updateError: RemoteError) => {
        if (this.ERROR.isResourceDneError(updateError)) {
          this.displaySelectedDayError(this.errorMessages['taskDoesNotExist']);
          this.deleteLocalEvent(_event, _index);
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
   * Updates an event's task's changed attributes
   * by making a service request to the API
   * @param {FeasyCalendarEvent} _event the event to update
   * @param {number} _index the index of the event in the selected day list
   */
  updateTask(_event: FeasyCalendarEvent, _index: number): void {
    this.disableEditing(_event);
    const task: Task = _event.getTask();
    const invalidTitle: boolean = !this.UTILS.hasValue(task.getTitle()) || task.getTitle().trim() === '';
    const invalidDueDate: boolean = !this.UTILS.hasValue(task.getDueDate());

    if (invalidTitle || invalidDueDate) {
      let errorMessage: string = 'Your task needs a ';
      if (invalidTitle && !invalidDueDate) errorMessage = `${errorMessage} title.`;
      else if (invalidDueDate && !invalidTitle) errorMessage = `${errorMessage} due date.`;
      else errorMessage = `${errorMessage} title and due date.`;

      // Refresh the event's task with the unedited, cached version
      const oldTask: Task = this.currentEditingTaskCopy.deepCopy();
      this.clearTaskCache();

      _event.setTask(oldTask);
      this.disableEditing(_event);

      this.displaySelectedDayError(errorMessage);
      this.scrollToSelectedDayTop();
    } else {
      // Updated fields are validated locally. Create promise variables to hold promises of service requests to update the task
      const updateTitlePromise = this.updateTitle(this.currentEditingTaskCopy, task);
      const updateDueDatePromise = this.updateDueDate(this.currentEditingTaskCopy, task);
      const updateTypePromise = this.updateType(this.currentEditingTaskCopy, task);
      const updateDescriptionPromise = this.updateDescription(this.currentEditingTaskCopy, task);

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
          this.enableEditing(_event);
          unknownErrors.forEach(unknownError => console.error(unknownError));
        } else if (errors.length > 0) {
          const errorMessages: string[] = errors.map(error => error.getCustomProperty('detailedErrorMessage'));
          const errorMessage: string = `${errorMessages.join('. ')}.`;

          this.displaySelectedDayError(errorMessage);
          this.scrollToSelectedDayTop();
          this.enableEditing(_event);
        } else {
          // No errors occurred so reset any previous errors
          this.resetSelectedDayError();

          // Check if attributes were actually updated
          const actuallyUpdated: string[] = resolutions.filter(resolution => typeof resolution === 'string');
          if (actuallyUpdated.length > 0) {
            // TODO: Display inline success icon
            const event: FeasyCalendarEvent = this.selectedDayEvents[_index];

            // If the due date was updated, remove it from the selected day list
            if (actuallyUpdated.some(attribute => attribute === 'dueDate')) {
              this.selectedDayEvents.splice(_index, 1);
              this.displaySelectedDaySuccess(this.successMessages['updatedTaskDueDate']);
              this.scrollToSelectedDayTop();

              event.setStartAndEnd(task.getDueDate());
              event.setColor(this.determineEventColor(task));
            }

            if (actuallyUpdated.some(attribute => attribute === 'title')) event.setEventTitle(task.getTitle());

            this.refreshCalendar();
          } else console.log('No task attributes were actually different');

          this.clearTaskCache();
        }
      }) // End then(resolutions)
      .catch(unhandledError => this.handleUnknownError(true, unhandledError)); // End Promises.all()
    }
  } // End updateTask()

  /**
   * Scrolls to the top of the selected day modal window with animation
   * @param {number} _duration the number of milliseconds for the duration
   * of the animation. If no value is given, the default value will be used
   */
  scrollToSelectedDayTop(_duration?: number): void {
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : this.times['scrollDuration'];
    $('#selectedDayModalTop').animate({ scrollTop: 0 }, duration);
  } // End scrollToSelectedDayTop()

  /**
   * Scrolls to the top of the calendar section with animation
   * @param {number} _duration the number of milliseconds for the duration
   * of the animation. If no value is given, the default value will be used
   */
  scrollToCalendarTop(_duration?: number): void {
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : this.times['scrollDuration'];
    this.scrollToElement('#topOfPage', _duration);
  }

  /**
   * Occurs when a day is clicked on in the week view
   * @param {any} _clickEvent the calendar click event
   */
  weekViewDayClicked(_clickEvent: any): void {
    const dateClicked: Date = _clickEvent.date;

    // Get the events for the day that was clicked on
    const selectedDayEvents: FeasyCalendarEvent[] = this.events.filter(event => isSameDay(event.start, dateClicked));

    // Refresh the list of selected day tasks with the events for the day that was clicked on
    this.selectedDayEvents.length = 0;
    selectedDayEvents.forEach(event => this.selectedDayEvents.push(event));

    this.openSelectedDayView(dateClicked);
  } // End weekViewDayClicked()

  /**
   * Creates a task through the API for the given new task
   * form in the selected day list modal. The task is added
   * to the selected day list and set of calendar events
   */
  createTask(): void {
    const taskTitle: string = this.newTask.getTitle();
    if (!this.UTILS.hasValue(taskTitle) || taskTitle.trim() === '') {
      const errorMessage: string = this.errorMessages['invalidNewTaskTitle'];
      this.displaySelectedDayError(errorMessage);
      this.scrollToSelectedDayTop();
    } else {
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

          const newEvent: FeasyCalendarEvent = this.addCalendarEvent(newTask);
          this.selectedDayEvents.push(newEvent);
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
    }
  } // End createTask()

  /**
   * Creates a new event for a given task and adds it to the events
   * @param {Task} _task the task to create the calendar event for
   * @return {FeasyCalendarEvent} the event that was created for the task
   */
  addCalendarEvent(_task: Task): FeasyCalendarEvent {
    const color: any = this.determineEventColor(_task);
    const calendarEvent: FeasyCalendarEvent = new FeasyCalendarEvent(_task, color);
    this.events.push(calendarEvent);

    return calendarEvent;
  } // End addCalendarEvent()

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
    setTimeout(() => self.resetSelectedDaySuccess(), this.times['displayMessage']);
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
    setTimeout(() => self.resetSelectedDayError(), this.times['displayMessage']);
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
    setTimeout(() => self.resetCalendarError(), this.times['displayMessage']);
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
    setTimeout(() => self.resetCalendarSuccess(), this.times['displayMessage']);
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
