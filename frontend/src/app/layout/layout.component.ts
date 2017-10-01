// Import angular packages
import {
  OnInit,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

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
import { QuickAddAssignmentsCreated } from '../objects/messages/quick-add-assignments-created';

// jQuery definition
declare var $: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  user: Account = new Account();
  displayName: string;
  avatarUrl: string;
  avatars: Object[] = [];

  taskArray: Assignment[] = [];
  testArray: Assignment[] = [];

  // quicksettings variables
  quickSettingDescription: boolean = true;
  quickSettingLabel: boolean = true;
  quickSettingColors: boolean = false;
  connectionMade: boolean = false;

  currentLocation: string;

  avatarError: boolean = false;
  avatarErrorMessage: string;
  avatarErrorDuplicateMessage: string = 'You are already using that avatar';
  /* tslint:disable max-line-length */
  standardAvatarErrorMessage: string = 'We are unable to update your avatar at this time. Please contact us at feasyresponse@gmail.com to fix this issue';
  /* tslint:enable max-line-length */

  quickAddError: boolean = false;
  quickAddErrorMessage: string;
  /* tslint:disable max-line-length */
  standardQuickAddErrorMessage: string = 'We are unable to create those assignments at this time. Please contact us at feasyresponse@gmail.com to fix this issue';
  /* tslint:enable max-line-length */

  avatarSuccess: boolean = false;
  avatarSuccessMessage: string;
  standardAvatarSuccessMessage: string = 'New avatar saved';

  quickAddSuccess: boolean = false;
  quickAddSuccessMessage: string;
  standardQuickAddSuccessMessage: string = 'All your tasks have been added to your calendar';

  // Subscription used to receive messages about when a row in the quick add modal is clicked
  quickAddModalRowSelectedSubscription: Subscription;

  constructor(
    private ROUTER: Router,
    private LOCATION: Location,
    private USERS: UserService,
    private ERROR: ErrorService,
    private UTILS: CommonUtilsService,
    private STORAGE: LocalStorageService,
    private AVATARS: AvatarService,
    private MESSAGING: MessagingService,
    private ASSIGNMENTS: AssignmentService,
  ) {}

  ngOnInit() {
    // Initialize the first assignment in the task array so it isn't null for Quick Add
    this.taskArray[0] = new Assignment();

    // Initialize the quick settings
    this.quickSettingColors = this.STORAGE.getItem('qsColor') === 'true';
    this.quickSettingDescription = this.STORAGE.getItem('qsDescription') === 'true';
    this.quickSettingLabel = this.STORAGE.getItem('qsLabel') === 'true';

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
        if (this.UTILS.hasValue(this.user.firstName) && this.user.firstName !== '') {
          this.displayName = this.user.firstName.charAt(0).toUpperCase() + this.user.firstName.slice(1);
        } else this.displayName = this.user.username;

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
   * Closes the side nav and optionally navigates
   * to a given route after closing the side nav
   * @param {string} followUpLink the route to navigate to after closing the nav
   */
  closeSideNav(followUpLink?: string): void {
    $('#button-slide').sideNav('hide');
    if (followUpLink === '/main/calendar') this.ROUTER.navigate([followUpLink]);
  } // End closeSideNav()

  /**
   * Closes the quick add modal and optionally
   * navigates to a given route after closing the modal
   * @param {string} followUpLink the route to navigate to after closing the modal
   */
  closeQuickAddModal(followUpLink?: string): void {
    $('#quickAdd').modal('close');
    $('#button-slide').sideNav('hide');
    if (followUpLink === '/main/calendar') this.ROUTER.navigate([followUpLink]);
  } // End closeSideNav()

  /**
   * Toggles specific quick settings in the side nav
   * @param {string} _settingName the name of the quick setting to toggle
   */
  toggleQuickSettings(_settingName: string): void {
    switch (_settingName) {
      case 'color':
        setTimeout(() => this.STORAGE.setItem('qsColor', this.quickSettingColors.toString()), 300);
        break;
      case 'label':
        setTimeout(() => this.STORAGE.setItem('qsLabel', this.quickSettingLabel.toString()), 300);
        break;
      case 'description':
        setTimeout(() => this.STORAGE.setItem('qsDescription', this.quickSettingDescription.toString()), 300);
        break;
      default:
        console.log('Can\'t toggle unknown settings type \'%s\'', _settingName);
    }
  } // End toggleQuickSettings()

  /**
   * Appends a new, empty Assignment to the end of the task array
   */
  incrementTaskArraySize(): void {
    const size = this.taskArray.length;
    this.taskArray[size] = new Assignment();

    // Add the date picker functionality to the new entry in the array of tasks
    this.quickAddFormInit()
  } // End incrementTaskArraySize()

  /**
   * Removes an assignment from the task array
   * @param {number} assignmentIndex the index of the assignment in the task array
   */
  removeFromTasks(assignmentIndex: number): void {
    this.taskArray.splice(assignmentIndex, 1);

    // Reset the first assignment if it was deleted
    if (this.taskArray.length === 0) this.taskArray[0] = new Assignment();
  } // End removeFromTasks()

  /**
   * Displays a modal to choose an avatar
   */
  displayAvatarSelection(): void {
    // Populate all the possible avatars
    this.avatars = this.AVATARS.getAllAvatars();

    // Make sure no errors are displayed inside the modal
    this.avatarError = false;
    this.avatarErrorMessage = '';

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
      // Clear any success message
      this.avatarSuccess = false;
      this.avatarSuccessMessage = '';

      // Display error message
      this.avatarError = true;
      this.avatarErrorMessage = this.avatarErrorDuplicateMessage;

      // Scroll to top of modal to make error message visible
      $('#avatarSelect').scrollTop(0);
      setTimeout(
        () => {
          this.avatarError = false;
          this.avatarErrorMessage = '';
        },
        3000);
    } else {
      // Clear any errors
      this.avatarError = false;
      this.avatarErrorMessage = '';
      this.USERS.updateAvatar(_avatarName)
        .then(() => {
          // Update the current avatar URL to the chosen one and close the selection modal
          this.avatarUrl = _avatarUrl;
          this.avatarSuccess = true;
          this.avatarSuccessMessage = this.standardAvatarSuccessMessage;

          // Scroll to top of modal to make success message visible
          $('#avatarSelect').scrollTop(0);
          setTimeout(
            () => {
              this.avatarSuccess = false;
              this.avatarSuccessMessage = '';
            },
            2500);
        }) // End then()
        .catch((updateError: RemoteError) => {
          // Clear any success message
          this.avatarSuccess = false;
          this.avatarSuccessMessage = '';

          // Scroll to top of modal to make error message visible
          this.avatarError = true;
          $('#avatarSelect').scrollTop(0);

          if (this.ERROR.isResourceError(updateError)) this.avatarErrorMessage = this.avatarErrorDuplicateMessage;
          else {
            this.avatarErrorMessage = this.standardAvatarErrorMessage;
            this.handleUnknownError(updateError);
          }

          setTimeout(
            () => {
              this.avatarError = false;
              this.avatarErrorMessage = '';
            },
            3000);
        }); // End this.USERS.updateAvatar()
    }
  } // End updateAvatar()

  /**
   * Opens the quick add modal
   */
  openQuickAdd(): void {
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
  }

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

              // Update the Assignment's due date because it isn't in a valid format when first created
              self.taskArray[index].dueDate = dueDate;
            } else console.error(quickAddRowMessage);
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
    // Clear any previous error and success messages
    this.quickAddSuccess = false;
    this.quickAddSuccessMessage = '';
    this.quickAddError = false;
    this.quickAddErrorMessage = '';

    let invalidTasks: number[] = [];
    for (let i = 0; i < this.taskArray.length; i++) {
      const task: Assignment = this.taskArray[i];
      if (!this.UTILS.hasValue(task.dueDate) || !this.UTILS.hasValue(task.title) ||  task.title === '') {
        invalidTasks.push(i);
      }
    }

    if (invalidTasks.length > 0) {
      // Scroll the modal to the top to display the error
      this.quickAddError = true;
      $('#quickAddContent').scrollTop(0);

      // Convert the invalid indexes to 1-based, not 0-based
      invalidTasks = invalidTasks.map(index => index + 1);

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

      this.quickAddErrorMessage = `Make sure ${taskOrTasks} ${tasksString} ${hasOrHave} both a due date and a name.`;

      setTimeout(
        () => {
          this.quickAddError = false;
          this.quickAddErrorMessage = '';
        },
        7500);
    } else {
      // Create the assignments all at once
      this.ASSIGNMENTS.bulkCreate(this.taskArray)
        .then((createdAssignments: Assignment[]) => {
          // Send a message that new assignments were created from the Quick Add modal
          this.MESSAGING.publish(new QuickAddAssignmentsCreated(createdAssignments));

          // Reset the task array
          this.taskArray = [];
          this.taskArray[0] = new Assignment();

          // Reset the date picker for the task array
          this.quickAddFormInit();

          this.quickAddSuccess = true;
          this.quickAddSuccessMessage = this.standardQuickAddSuccessMessage;
          $('#quickAddContent').scrollTop(0);

          setTimeout(
            () => {
              this.quickAddSuccess = false;
              this.quickAddSuccessMessage = '';
            },
            3000);
        }) // End then(createdAssignments)
        .catch((bulkCreateError: any) => {
          this.quickAddError = true;
          this.quickAddErrorMessage = this.standardQuickAddErrorMessage;
          $('#quickAddContent').scrollTop(0);

          console.error(bulkCreateError);
          console.log(this.taskArray);
          setTimeout(
            () => {
              this.quickAddError = false;
              this.quickAddErrorMessage = '';
            },
            7500);

        }); // End this.ASSIGNMENTS.bulkCreate()
      }
  } // End addTasksInBulk()

  /**
   * Handles errors received from an API call
   * @param {Response} [_error = new Response()] the Response error from the API call
   */
  private handleError(_error: Response = new Response()): void {
    if (_error.status === 401 || _error.status === 404) {
      // Token is stale. Clear the user and token local storage
      this.STORAGE.deleteItem('token');
      this.STORAGE.deleteItem('currentUser');

      // Add the reason for re-routing to login
      if (_error.status === 401) this.STORAGE.setItem('expiredToken', 'true');
      else if (_error.status === 404) this.STORAGE.setItem('userDoesNotExist', 'true');

      // Route to the login page
      this.ROUTER.navigate(['/login']);
    } else {
      // API error, server could be down/crashed
      console.error(_error);
    }
  } // End handleError()

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
    }
  } // End handleUnknownError()
}
