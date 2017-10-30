// Import angular packages
import {
  OnInit,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';

// Import 3rd-party libraries
import { Subscription } from 'rxjs/Subscription';

// Import our files
import { Account } from '../objects/account';
import { Assignment } from '../objects/assignment';
import { RemoteError } from '../objects/remote-error';
import { UserService } from '../services/user.service';
import { ErrorService } from '../services/error.service';
import { AvatarService } from '../services/avatar.service';
import { MessagingService } from '../services/messaging.service';
import { AssignmentService } from '../services/assignment.service';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';
import { TaskDatePicked } from '../objects/messages/task-date-picked';
import { QuickSettingsService } from '../services/quick-settings.service';
import { QuickAddAssignmentsCreated } from '../objects/messages/quick-add-assignments-created';

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
  taskArray: Assignment[];

  // Quick Settings variables
  quickSettingType: boolean;
  quickSettingColors: boolean;
  quickSettingDescription: boolean;

  defaultMessageDisplayTime: number = 5000;

  errors: Object = {
    avatar: {
      occurred: false,
      message: '',
      defaultMessage: 'We are unable to update your avatar at this time. Please contact us at feasyresponse@gmail.com to fix this issue',
      duplicateMessage: 'You are already using that avatar.',
    },
    general: {
      occurred: false,
      message: '',
      /* tslint:disable max-line-length */
      defaultMessage: 'We are unable to create those assignments at this time. Please contact us at feasyresponse@gmail.com to fix this issue',
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
      defaultMessage: 'All your tasks have been added to your calendar',
    },
  };

  // Subscription used to receive messages about when a row in the quick add modal is clicked
  quickAddModalRowSelectedSubscription: Subscription;

  constructor(
    private ROUTER: Router,
    private USERS: UserService,
    private ERROR: ErrorService,
    private AVATARS: AvatarService,
    private UTILS: CommonUtilsService,
    private MESSAGING: MessagingService,
    private STORAGE: LocalStorageService,
    private TASKS: AssignmentService,
    private QUICK_SETTINGS: QuickSettingsService,
  ) {}

  ngOnInit() {
    this.taskArray = [new Assignment()];

    // Populate all the possible avatars
    this.avatars = this.AVATARS.getAllAvatars();

    // Initialize the quick settings
    this.quickSettingType = this.QUICK_SETTINGS.getShowType();
    this.quickSettingColors = this.QUICK_SETTINGS.getShowColors();
    this.quickSettingDescription = this.QUICK_SETTINGS.getShowDescription();

    // Instantiate the side nav
    $('#button-slide').sideNav();

    // Initialize the quick add form date picker
    this.quickAddFormInit();

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
          console.error(getError);
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
    this.taskArray = null;

    $('#button-slide').sideNav('hide');
    if (_followUpUrl === '/main/calendar') this.ROUTER.navigate([_followUpUrl]);
  } // End closeSideNav()

  /**
   * Toggles specific quick settings in the side nav
   * @param {string} _settingName the name of the quick setting to toggle
   */
  toggleQuickSettings(_settingName: string): void {
    switch (_settingName) {
      case 'color':
        setTimeout(() => this.QUICK_SETTINGS.toggleShowColors(), 300);
        break;
      case 'type':
        setTimeout(() => this.QUICK_SETTINGS.toggleShowType(), 300);
        break;
      case 'description':
        setTimeout(() => this.QUICK_SETTINGS.toggleShowDescription(), 300);
        break;
      default:
        console.error('Can\'t toggle unknown settings type \'%s\'', _settingName);
    }
  } // End toggleQuickSettings()

  /**
   * Appends a new, empty task to the end of the task array
   */
  increaseTaskArraySize(): void {
    const size = this.taskArray.length;
    this.taskArray[size] = new Assignment();

    // Add the date picker functionality to the new entry in the array of tasks
    this.quickAddFormInit()
  } // End increaseTaskArraySize()

  /**
   * Removes an assignment from the task array
   * @param {number} _taskIndex the index of the assignment in the task array
   */
  removeTask(_taskIndex: number): void {
    this.taskArray.splice(_taskIndex, 1);

    // Reset the first assignment if it was deleted
    if (this.taskArray.length === 0) this.taskArray[0] = new Assignment();
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
   * @param {number} _duration the amount of seconds to display
   * the message for. If no value is given, the default duration
   * will be used (class variable: defaultMessageDisplayTime)
   */
  private displayMessage(_messageIsError: boolean, _source: string, _message?: string, _duration?: number): void {
    const messageType: Object = _messageIsError ? this.errors : this.success;
    messageType[_source]['occurred'] = true;
    messageType[_source]['message'] = _message || messageType[_source]['defaultMessage'];

    const duration: number = typeof _duration === 'number' ? _duration * 1000 : this.defaultMessageDisplayTime;
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
    $('#quickAdd').modal('open');
  } // End openQuickAdd()

  /**
   * Sends a message to subscribers about the assignment
   * and row that was chosen in the quick add modal
   * @param {Assignment} _task the assignment for the given row that was clicked
   * @param {number} _index the 0-based index representing the row
   * that was clicked on in the row of tasks in the quick add modal
   */
  publishDatePick(_task: Assignment, _index: number): void {
    this.MESSAGING.publish(new TaskDatePicked(_task, _index));
  } // End publishDatePick()

  /**
   * Initializes the Materialize date picker for
   * the quick add modal's current set of rows
   */
  quickAddFormInit(): void {
    const self = this;
    $(document).ready(function () {
      // Create a variable to hold the message that will be sent when the date field for a row is selected
      let quickAddRowMessage;

      // Configure the Materialize date picker
      $('.quickAddDatePicker').pickadate({
        // Called every time the date picker is opened
        onOpen: () => {
          /*
           * When the date picker opens, subscribe to receive a message
           * about which index was clicked on to open the date picker
           */
          self.quickAddModalRowSelectedSubscription = self.MESSAGING.messagesOf(TaskDatePicked)
            .subscribe(message => quickAddRowMessage = message);
        },

        // Called whenever a date within the date picker is selected or the range is updated
        onSet: (context) => {
          // Check if the user clicked on an actual date, not a range selection
          if (self.UTILS.hasValue(context.select)) {
            let index: number;
            if (self.UTILS.hasValue(quickAddRowMessage) && self.UTILS.hasValue(quickAddRowMessage.getIndex())) {
              index = quickAddRowMessage.getIndex();
            } else index = -1;

            if (index !== -1) {
              // Create a date from the selected day and set the time to 12 pm
              const unixMilliseconds12Hours: number = 43200000;
              const unixMilliseconds: number = context.select;
              const dueDate: Date = new Date(unixMilliseconds + unixMilliseconds12Hours);

              // Update the task's due date because it isn't in a valid format when first created
              self.taskArray[index].setDueDate(dueDate);
            }
          }
        },

        // Called every time the date picker is exited
        onClose: () => {
          // Unsubscribe to ensure no memory leaks or receiving of old messages
          if (self.UTILS.hasValue(self.quickAddModalRowSelectedSubscription)) self.quickAddModalRowSelectedSubscription.unsubscribe();
        },

        // Other date picker configuration properties
        min: new Date(1970, 0, 1), // Set the min selectable date as 01/01/1970
        max: false, // Max date is not constrained
        selectMonths: true, // Creates a dropdown to quick select the month
        selectYears: 25, // Creates a dropdown of 25 years at a time to quick select the year
        format: 'dddd, mmmm d, yyyy', // Display format once a date has been selected
        formatSubmit: 'yyyy/mm/dd', // Date format that is provided to the onSet method
        hiddenName: true, // Ensures that submitted format is used in the onSet method, not regular format
      });
    });
  } // End quickAddFormInit()

  /**
   * Sends a request to add all the tasks in the task array at the same time
   */
  addTasksInBulk(): void {
    this.clearAllQuickAddMessages();

    /*
     * Validate all the tasks' due dates and titles first. Get an
     * iterator representing each index of the task array (but 1-based)
     */
    const iterator: IterableIterator<number> = this.UTILS.integerSequence(1);

    /*
     * Map each task to it's 1-based index if the due date/title is
     * invalid, or null if it is valid. Then filter only the assignment
     * indexes who were invalid and display those in an error message
     */
    const invalidTasks: number[] =  this.taskArray.map((task: Assignment) => {
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

      const errorMessage: string = `Make sure ${taskOrTasks} ${tasksString} ${hasOrHave} both a due date and a name.`;
      this.displayQuickAddError(errorMessage);
      this.scrollToQuickAddTop();
    } else {
      // All the tasks are valid, so send a reques to create them all
      this.TASKS.bulkCreate(this.taskArray)
        .then((createdTasks: Assignment[]) => {
          // Send a message that new assignments were created from the Quick Add modal
          this.MESSAGING.publish(new QuickAddAssignmentsCreated(createdTasks));

          // Reset the task array
          this.taskArray = [new Assignment()];

          // Reset the date picker for the task array
          this.quickAddFormInit();

          this.displayQuickAddSuccess();
          this.scrollToQuickAddTop();
        }) // End then(createdTasks)
        .catch((bulkCreateError: Error) => {
          // TODO: Handle Local/Remote errors that are caught
          this.displayQuickAddError();
          this.scrollToQuickAddTop();

          console.error(bulkCreateError);
          console.log(this.taskArray);
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
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : 250;
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
