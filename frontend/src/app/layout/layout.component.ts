// Import angular packages
import {
  OnInit,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';

// Import 3rd-party libraries
import { Subscription } from 'rxjs/Subscription';

// Import our files
import { Task } from '../objects/task';
import { Account } from '../objects/account';
import { RemoteError } from '../objects/remote-error';
import { TaskService } from '../services/task.service';
import { UserService } from '../services/user.service';
import { ErrorService } from '../services/error.service';
import { AvatarService } from '../services/avatar.service';
import { MessagingService } from '../services/messaging.service';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';
import { TaskDatePicked } from '../objects/messages/task-date-picked';
import { QuickSettingsService } from '../services/quick-settings.service';
import { QuickAddTasksCreated } from '../objects/messages/quick-add-tasks-created';
import { QuickSettingsColorToggle } from '../objects/messages/quick-settings-color-toggle';

declare var $: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  user: Account;
  displayName: string;
  avatarUrl: string;
  avatars: Object[];

  // Array of tasks for the quick add modal
  quickAddTasks: Task[];

  quickSettings: any = {
    type: false,
    colors: false,
    description: false,
    calendarView: false,
  };

  // Materialize date-picker holder
  datePicker: any;

  private times: Object = {
    quickSettingToggle: 150,
    displayMessage: 5000,
    routeToCalendar: 500,
    scrollDuration: 250,
  };

  errors: Object = {
    avatar: {
      occurred: false,
      message: '',
      defaultMessage: 'We are unable to update your avatar at this time. Please contact us at feasyresponse@gmail.com to fix this issue.',
      duplicateMessage: 'You are already using that avatar.',
    },
    general: {
      occurred: false,
      message: '',
      /* tslint:disable max-line-length */
      defaultMessage: 'We are unable to create those tasks at this time. Please contact us at feasyresponse@gmail.com to fix this issue.',
      /* tslint:enable max-line-length */
    },
  };

  success: Object = {
    avatar: {
      occurred: false,
      message: '',
      defaultMessage: 'New avatar saved',
    },
    general: {
      occurred: false,
      message: '',
      defaultMessage: 'These tasks have been added to your calendar! Click here to see your updated calendar.',
    },
  };

  // Subscription used to receive messages about when a row in the quick add modal is clicked
  quickAddModalRowSelectedSubscription: Subscription;

  constructor(
    private ROUTER: Router,
    private TASKS: TaskService,
    private USERS: UserService,
    private ERROR: ErrorService,
    private AVATARS: AvatarService,
    private UTILS: CommonUtilsService,
    private MESSAGING: MessagingService,
    private STORAGE: LocalStorageService,
    private QUICK_SETTINGS: QuickSettingsService,
  ) {}

  ngOnInit() {
    this.USERS.startTokenAutoRefresh();

    this.quickAddTasks = [];

    // Populate all the possible avatars
    this.avatars = this.AVATARS.getAllAvatars();

    // Initialize the quick settings
    this.quickSettings.type = this.QUICK_SETTINGS.getShowType();
    this.quickSettings.colors = this.QUICK_SETTINGS.getShowColors();
    this.quickSettings.description = this.QUICK_SETTINGS.getShowDescription();
    this.quickSettings.calendarView = this.QUICK_SETTINGS.getDefaultCalendarViewIsWeek();

    // Instantiate the side nav
    $('#button-slide').sideNav();

    /*
     * Initialize the avatar URL to the default before the service request
     * to get the user's avatar so the image is not null when the page loads
     */
    this.avatarUrl = this.AVATARS.getDefaultAvatarUrl();

    // Save the username to the variable to use it inside the service call closure
    const currentUser: string = this.STORAGE.getItem('currentUser');
    this.USERS.get(currentUser)
      .then((userAccount: Account) => {
        this.user = userAccount;

        // Add the user's first name or their username to the side nav
        const firstName: string = this.user.getFirstName();
        if (this.UTILS.hasValue(firstName) && firstName.trim() !== '') {
          this.displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        } else this.displayName = this.user.getUsername();

        // Get the URL corresponding to the user's avatar and update the image in the side nav
        this.avatarUrl = this.AVATARS.getAvatarUrl(this.user.avatar);
      }) // End then(userAccount)
      .catch((getError: RemoteError) => {
        if (this.ERROR.isInvalidRequestError(getError)) {
          this.displayName = 'User';
        } else this.handleUnknownError(getError);
      }); // End this.USERS.get()
  } // End ngOnInit()

  ngOnDestroy() {
    // Unsubscribe to ensure no memory leaks or duplicate messages
    if (this.UTILS.hasValue(this.quickAddModalRowSelectedSubscription)) this.quickAddModalRowSelectedSubscription.unsubscribe();
  } // End ngOnDestroy()

  /**
   * Removes auto-login information from local
   * storage and routes the user to the login page
   */
  logUserOut(): void {
    // Clear the local storage information that allows for auto-login
    this.STORAGE.deleteItem('token');
    this.STORAGE.deleteItem('currentUser');

    // Route back to the login page
    $('#button-slide').sideNav('destroy');
    this.ROUTER.navigate(['/login']);
  } // End logUserOut()

  /**
   * Opens a system-native pop-up window to send an email to Feasy
   */
  emailFeasy(): void {
    window.location.href = 'mailto:feasyresponse@gmail.com';
  } // End emailFeasy()

  /**
   * Closes the side nav and optionally navigates
   * to a given route after closing the side nav
   * @param {string} _followUpUrl the route to navigate to after closing the nav
   */
  closeSideNav(_followUpUrl?: string): void {
    $('#button-slide').sideNav('hide');
    if (_followUpUrl === '/main/calendar') this.ROUTER.navigate([_followUpUrl]);
  } // End closeSideNav()

  /**
   * Closes the quick add modal and optionally
   * navigates to a given route after closing the modal
   * @param {string} _followUpUrl the route to navigate to after closing the modal
   */
  closeQuickAddModal(_followUpUrl?: string): void {
    $('#quickAdd').modal('close');
    $('#button-slide').sideNav('hide');
    if (_followUpUrl === '/main/calendar') {
      const self = this;
      setTimeout(() => self.ROUTER.navigate([_followUpUrl]), self.times['routeToCalendar']);
    }
  } // End closeQuickAddModal()

  /**
   * Toggles specific quick settings in the side nav
   * @param {string} _settingName the name of the quick setting to toggle
   */
  toggleQuickSettings(_settingName: string): void {
    const self = this;
    switch (_settingName) {
      case 'color':
        setTimeout(
          () => {
            self.QUICK_SETTINGS.toggleShowColors();
            const shouldDisplayColors: boolean = self.QUICK_SETTINGS.getShowColors();
            self.MESSAGING.publish(new QuickSettingsColorToggle(shouldDisplayColors));
          },
          this.times['quickSettingToggle']);
        break;
      case 'type':
        setTimeout(() => self.QUICK_SETTINGS.toggleShowType(), this.times['quickSettingToggle']);
        break;
      case 'description':
        setTimeout(() => self.QUICK_SETTINGS.toggleShowDescription(), this.times['quickSettingToggle']);
        break;
      case 'calendarView':
        setTimeout(() => self.QUICK_SETTINGS.toggleDefaultCalendarViewAsWeek(), this.times['quickSettingsToggle']);
        break;
      default:
        console.error('Can\'t toggle unknown settings type \'%s\'', _settingName);
    }
  } // End toggleQuickSettings()

  /**
   * Appends a new, empty task to the end of the task list
   */
  increaseTaskArraySize(): void {
    const size = this.quickAddTasks.length;
    this.quickAddTasks[size] = new Task();

    // Add the date picker functionality to the new entry in the array of tasks
    this.quickAddDatePickerInit()
  } // End increaseTaskArraySize()

  /**
   * Removes a task from the task list
   * @param {number} _taskIndex the index of the task in the task list
   */
  removeTask(_taskIndex: number): void {
    this.quickAddTasks.splice(_taskIndex, 1);

    // Reset the first task if it was deleted
    if (this.quickAddTasks.length === 0) {
      this.quickAddTasks.push(new Task());
      this.quickAddDatePickerInit();
    }
  } // End removeTask()

  /**
   * Displays a modal to choose an avatar
   */
  displayAvatarSelection(): void {
    // Make sure no messages are displayed inside the modal
    this.clearAllAvatarMessages();

    // Open the avatar selction modal
    $('#avatarSelect').modal('open');
  } // End displayAvatarSelection()

  /**
   * Sends a request to update the user's avatar
   * @param {string} _avatarUrl the absolute
   * URL path to the image for the user's avatar
   * @param {string} _avatarName the name of the icon
   */
  updateAvatar(_avatarUrl: string, _avatarName: string): void {
    // Check that the selected avatar is different from the current one
    if (_avatarUrl === this.avatarUrl) {
      this.clearAvatarSuccess();
      this.displayAvatarError(this.errors['avatar']['duplicateMessage']);
      this.scrollToAvatarTop();
    } else {
      // Clear any errors
      this.clearAvatarError();
      this.USERS.updateAvatar(_avatarName)
        .then(() => {
          // Update the current avatar URL to the chosen one and close the selection modal
          this.avatarUrl = _avatarUrl;
          this.displayAvatarSuccess();
          this.scrollToAvatarTop();
        }) // End then()
        .catch((updateError: RemoteError) => {
          this.clearAvatarSuccess();

          let errorMessage: string
          if (this.ERROR.isResourceError(updateError)) errorMessage = this.errors['avatar']['duplicateMessage'];
          else {
            errorMessage = this.errors['avatar']['defaultMessage'];
            this.handleUnknownError(updateError);
          }

          this.displayAvatarError(errorMessage);
          this.scrollToAvatarTop();
        }); // End this.USERS.updateAvatar()
    }
  } // End updateAvatar()

  /**
   * Displays a message somewhere in the component
   * @param {boolean} _messageIsError whether
   * or not the message to display is an error
   * @param {string} _source the place in the component where the message should
   * be displayed. Needs to be value in either the errors/success class JSON
   * @param {string} _message the message to display. If no
   * value is given, the default message for _source will be used
   * @param {number} _duration the amount of seconds to display the
   * message for. If no value is given, the default duration will be used
   */
  private displayMessage(_messageIsError: boolean, _source: string, _message?: string, _duration?: number): void {
    const messageType: Object = _messageIsError ? this.errors : this.success;
    messageType[_source]['occurred'] = true;
    messageType[_source]['message'] = _message || messageType[_source]['defaultMessage'];

    const duration: number = typeof _duration === 'number' ? _duration * 1000 : this.times['displayMessage'];
    setTimeout(
      () => {
        messageType[_source]['occurred'] = false;
        messageType[_source]['message'] = '';
      },
      duration);
  } // End displayMessage()

  /**
   * Clears any message for a specific location in the component
   * @param {boolean} _messageIsError whether
   * or not the message to clear is an error
   * @param {string} _source the place in the component where the message should
   * be cleared. Needs to be value in either the errors/success class JSONs
   */
  private clearMessage(_messageIsError: boolean, _source: string): void {
    const messageType: Object = _messageIsError ? this.errors : this.success;
    messageType[_source]['occurred'] = false;
    messageType[_source]['message'] = '';
  } // End displayMessage()

  /**
   * Displays a message in the avatar modal
   * @param {boolean} _messageIsError whether or not
   * the message should have error or success styling
   * @param {string} _message the message to display. If no value
   * is given, the default message for the avatar modal will be used
   * @param {number} _duration the amount of seconds to display the
   * message for. If no value is given, the default duration will be used
   */
  private displayMessageInAvatarModal(_messageIsError: boolean, _message?: string, _duration?: number): void {
    this.displayMessage(_messageIsError, 'avatar', _message, _duration);
  } // End displayMessageInAvatarModal()

  /**
   * Clears any message displayed in the avatar modal
   * @param {boolean} _messageIsError whether
   * or not the message to clear is an error
   */
  private clearAvatarModalMessage(_messageIsError: boolean): void {
    this.clearMessage(_messageIsError, 'avatar');
  } // End clearAvatarModalMessage()

  /**
   * Displays a message in the quick add modal
   * @param {boolean} _messageIsError whether or not
   * the message should have error or success styling
   * @param {string} _message the message to display. If no value is
   * given, the default message for the quick add modal will be used
   * @param {number} _duration the amount of seconds to display the
   * message for. If no value is given, the default duration will be used
   */
  private displayMessageInQuickAddModal(_messageIsError: boolean, _message?: string, _duration?: number): void {
    this.displayMessage(_messageIsError, 'general', _message, _duration);
  } // End displayMessageInQuickAddModal()

  /**
   * Clears any message displayed in the quick add modal
   * @param {boolean} _messageIsError whether
   * or not the message to clear is an error
   */
  private clearQuickAddModalMessage(_messageIsError: boolean): void {
    this.clearMessage(_messageIsError, 'general');
  } // End clearQuickAddModalMessage()

  /**
   * Displays an error message in the avatar modal
   * @param {string} _message the error message to display. If no value
   * is given, the default error message for the avatar modal will be used
   * @param {number} _duration the amount of seconds to display the
   * message for. If no value is given, the default duration will be used
   */
  displayAvatarError(_message?: string, _duration?: number): void {
    this.displayMessageInAvatarModal(true, _message, _duration);
  } // End displayAvatarError()

  /**
   * Clears any error message in the avatar modal
   */
  clearAvatarError(): void {
    this.clearAvatarModalMessage(true);
  } // End clearAvatarError()

  /**
   * Displays an error message in the quick add modal
   * @param {string} _message the error message to display. If no value is
   * given, the default error message for the quick add modal will be used
   * @param {number} _duration the amount of seconds to display the
   * message for. If no value is given, the default duration will be used
   */
  displayQuickAddError(_message?: string, _duration?: number): void {
    this.displayMessageInQuickAddModal(true, _message, _duration);
  } // End displayQuickAddError()

  /**
   * Clears any error message in the quick add modal
   */
  clearQuickAddError(): void {
    this.clearQuickAddModalMessage(true);
  } // End clearQuickAddError()

  /**
   * Displays a success message in the avatar modal
   * @param {string} _message the success message to display. If no value
   * is given, the default success message for the avatar modal will be used
   * @param {number} _duration the amount of seconds to display the
   * message for. If no value is given, the default duration will be used
   */
  displayAvatarSuccess(_message?: string, _duration?: number): void {
    this.displayMessageInAvatarModal(false, _message, _duration);
  } // End displayAvatarSuccess()

  /**
   * Clears any success message in the avatar modal
   */
  clearAvatarSuccess(): void {
    this.clearAvatarModalMessage(false);
  } // End clearAvatarSuccess()

  /**
   * Displays a success message in the quick add modal
   * @param {string} _message the success message to display. If no value is
   * given, the default success message for the quick add modal will be used
   * @param {number} _duration the amount of seconds to display the
   * message for. If no value is given, the default duration will be used
   */
  displayQuickAddSuccess(_message?: string, _duration?: number): void {
    this.displayMessageInQuickAddModal(false, _message, _duration);
  } // End displayQuickAddSuccess()

  /**
   * Clears any success message in the quick add modal
   */
  clearQuickAddSuccess(): void {
    this.clearQuickAddModalMessage(false);
  } // End clearQuickAddSuccess()

  /**
   * Clears any success or error messages in the avatar modal
   */
  clearAllAvatarMessages(): void {
    this.clearAvatarError();
    this.clearAvatarSuccess();
  } // End clearAllAvatarMessages()

  /**
   * Clears any success or error messages in the quick add modal
   */
  clearAllQuickAddMessages(): void {
    this.clearQuickAddError();
    this.clearQuickAddSuccess();
  } // End clearAllQuickAddMessages()

  /**
   * Opens the quick add modal
   */
  openQuickAdd(): void {
    this.clearAllQuickAddMessages();
    this.quickAddTasks.length = 0;
    this.quickAddTasks.push(new Task());
    this.quickAddDatePickerInit();
    $('#quickAdd').modal('open');
  } // End openQuickAdd()

  /**
   * Sends a message to subscribers about the task
   * and row that was chosen in the quick add modal
   * @param {Task} _task the task for the given row that was clicked
   * @param {number} _index the 0-based index representing the row
   * that was clicked on in the row of tasks in the quick add modal
   */
  publishDatePick(_task: Task, _index: number): void {
    this.MESSAGING.publish(new TaskDatePicked(_task, _index));
  } // End publishDatePick()

  /**
   * Initializes the Materialize date picker for
   * the quick add modal's current set of rows
   */
  quickAddDatePickerInit(): void {
    const self = this;
    $(document).ready(() => {
      // Create a variable to hold the message that will be sent when the date field for a row is selected
      let quickAddRowMessage;
      const onOpen: Function = () => {
        /*
         * When the date picker opens, subscribe to receive a message
         * about which index was clicked on to open the date picker
         */
        self.quickAddModalRowSelectedSubscription = self.MESSAGING.messagesOf(TaskDatePicked)
          .subscribe(message => quickAddRowMessage = message);
      };

      const onSet: Function = (context) => {
        let index: number = -1;
        if (self.UTILS.hasValue(quickAddRowMessage) && self.UTILS.hasValue(quickAddRowMessage.getIndex())) {
          index = quickAddRowMessage.getIndex();
        }

        // Check if the user clicked on an actual date, not a range selection
        if (self.UTILS.hasValue(context.select)) {
          if (index !== -1) {
            const unixMilliseconds: number = context.select;
            const dueDate: Date = new Date(unixMilliseconds + self.UTILS.getUnixMilliseconds12Hours());

            // Update the task's due date because it isn't in a valid format when first created
            self.quickAddTasks[index].setDueDate(dueDate);
          }
        } else if (context.hasOwnProperty('clear')) {
          // Reset the task's due date in the HTML form
          if (index !== -1) self.quickAddTasks[index].setDueDate(null);
        }
      };

      const onClose: Function = () => {
        // Unsubscribe to ensure no memory leaks or receiving of old messages
        if (self.UTILS.hasValue(self.quickAddModalRowSelectedSubscription)) self.quickAddModalRowSelectedSubscription.unsubscribe();
      };

      self.datePicker = self.configureDatePicker('.quickAddDatePicker', onOpen, onSet, onClose);
      self.datePicker.start();
    });
  } // End quickAddDatePickerInit()

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
   * Sends a request to add all the tasks in the task list at the same time
   */
  addTasksInBulk(): void {
    this.clearAllQuickAddMessages();

    /*
     * Validate all the tasks' due dates and titles first. Get an
     * iterator representing each index of the task list (but 1-based)
     */
    const iterator: IterableIterator<number> = this.UTILS.integerSequence(1);

    /*
     * Map each task to it's 1-based index if the due date/title is
     * invalid, or null if it is valid. Then filter only the task
     * indexes who were invalid and display those in an error message
     */
    const invalidTasks: number[] =  this.quickAddTasks.map((task: Task) => {
        const oneBasedIndex: number = iterator.next().value;
        /* tslint:disable max-line-length */
        if (!this.UTILS.hasValue(task.getDueDate()) || !this.UTILS.hasValue(task.getTitle()) ||  task.getTitle() === '') return oneBasedIndex;
        /* tslint:enable max-line-length */
        else return null;
      })
      .filter((index: number) => index !== null);

    if (invalidTasks.length > 0) {
      // Determine the grammar to use based on if there is one or more invalid tasks
      const taskOrTasks: string = invalidTasks.length === 1 ? 'task' : 'tasks';
      const hasOrHave: string = invalidTasks.length === 1 ? 'has' : 'have';

      // Build the error message to contain the invalid task indexes in a pretty sentence
      let tasksString: string;
      if (invalidTasks.length > 1) {
        // Get all tasks but the last one and join them by commas
        const firstInvalidTasks: number[] = invalidTasks.slice(0, invalidTasks.length - 1);
        tasksString = firstInvalidTasks.join(', ');

        // Add the word 'and' before the very last task index
        if (invalidTasks.length === 2) tasksString = `${tasksString} and ${invalidTasks[invalidTasks.length - 1]}`;
        else tasksString = `${tasksString}, and ${invalidTasks[invalidTasks.length - 1]}`;
      } else tasksString = String(invalidTasks[0]);

      const errorMessage: string = `Make sure ${taskOrTasks} ${tasksString} ${hasOrHave} both a due date and a title.`;
      this.displayQuickAddError(errorMessage);
      this.scrollToQuickAddTop();
    } else {
      // All the tasks are valid, so send a reques to create them all
      this.TASKS.bulkCreate(this.quickAddTasks)
        .then((createdTasks: Task[]) => {
          // Send a message that new tasks were created from the Quick Add modal
          this.MESSAGING.publish(new QuickAddTasksCreated(createdTasks));

          // Reset the task list
          this.quickAddTasks.length = 0;
          this.quickAddTasks.push(new Task());

          // Reset the date picker for the task list
          this.quickAddDatePickerInit();

          this.displayQuickAddSuccess();
          this.scrollToQuickAddTop();
        }) // End then(createdTasks)
        .catch((bulkCreateError: Error) => {
          // TODO: Handle Local/Remote errors that are caught
          this.displayQuickAddError();
          this.scrollToQuickAddTop();

          // Reset the date picker for the task list
          this.quickAddDatePickerInit();

          console.error(bulkCreateError);
          console.log(this.quickAddTasks);
        }); // End this.TASKS.bulkCreate()
      }
  } // End addTasksInBulk()

  /**
   * Scrolls to a specific HTML element in a modal window with animation
   * @param {string} [_identifier = ''] the HTML tag
   * identifier for the page element to scroll to
   * @param {number} _duration the number of
   * milliseconds for the duration of the animation
   */
  scrollToModalTop(_identifier: string = '', _duration?: number): void {
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : this.times['scrollDuration'];
    $(_identifier).animate({ scrollTop: 0 }, duration);
  } // End scrollToModalTop()

  /**
   * Scrolls to the top of the avatar modal
   * @param {number} _duration the number of
   * milliseconds for the duration of the animation
   */
  scrollToAvatarTop(_duration?: number): void {
    this.scrollToModalTop('#avatarSelect', _duration);
  } // End scrollToAvatarTop()

  /**
   * Scrolls to the top of the quick add modal
   * @param {number} _duration the number of
   * milliseconds for the duration of the animation
   */
  scrollToQuickAddTop(_duration?: number): void {
    this.scrollToModalTop('#quickAddContent', _duration);
  } // End scrollToQuickAddTop()

  /**
   * Handles errors that can't be determined elsewhere and logs the error
   * @param {RemoteError} [_error] the unknown error
   */
  private handleUnknownError(_error: RemoteError): void {
    console.error(_error);
    if (this.ERROR.isAuthError(_error)) {
      this.STORAGE.deleteItem('token');
      this.STORAGE.deleteItem('currentUser');

      this.STORAGE.setItem('expiredToken', 'true');
      this.ROUTER.navigate(['/login']);
    }
  } // End handleUnknownError()
}
