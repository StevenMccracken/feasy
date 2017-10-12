// Import angular packages
import {
  Inject,
  OnInit,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';

// Import 3rd-party libraries
import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs/Subscription';

// Import our files
import { Error } from '../../objects/error';
import { Assignment } from '../../objects/assignment';
import { LocalError } from '../../objects/local-error';
import { RemoteError } from '../../objects/remote-error';
import { ErrorService } from '../../services/error.service';
import { MessagingService } from '../../services/messaging.service';
import { AssignmentService } from '../../services/assignment.service';
import { CommonUtilsService } from '../../utils/common-utils.service';
import { LocalStorageService } from '../../utils/local-storage.service';
import { TaskDatePicked } from '../../objects/messages/task-date-picked';

declare var $: any;

@Component({
  selector: 'app-to-do',
  templateUrl: './to-do.component.html',
  styleUrls: ['./to-do.component.css'],
})
export class ToDoComponent implements OnInit {
  today: Date = new Date();
  newAssignment: Assignment;
  assignmentCopy: Assignment;

  showList: boolean = false;
  doneSorting: boolean = false;

  completeAssignments: Assignment[];
  incompleteAssignments: Assignment[];

  // Subscription used to receive messages about when a row in the incomplete section is clicked
  assignmentRowSelectedSubscription: Subscription;

  defaultMessageDisplayTime: number = 5000;

  errors: Object = {
    general: {
      occurred: false,
      message: '',
      defaultMessage: 'Something bad happened. Please try that again or contact us at feasyresponse@gmail.com to fix this issue.',
    },
    completedAssignments: {
      occurred: false,
      message: '',
      defaultMessage: 'Unable to complete that assignment right now. Please try again.',
    },
    incompleteAssignments: {
      occurred: false,
      message: '',
      defaultMessage: 'Unable to update that assignment to be incomplete right now. Please try again.',
    },
    assignmentDoesNotExist: {
      occurred: false,
      message: '',
      defaultMessage: 'That assignment no longer exists.',
    },
  };

  success: Object = {
    completedAssignments: {
      occurred: false,
      message: '',
      defaultMessage: 'Amazing job completing that assignment. Keep it going!',
    },
    incompleteAssignments: {
      occurred: false,
      message: '',
      defaultMessage: 'Unable to update that assignment to be incomplete right now. Please try again.',
    },
    assignmentCreated: {
      occurred: false,
      message: '',
      defaultMessage: 'Your assignment has been created.',
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
    private ERROR: ErrorService,
    private UTILS: CommonUtilsService,
    private MESSAGING: MessagingService,
    private STORAGE: LocalStorageService,
    private ASSIGNMENTS: AssignmentService,
    private DRAGULA_SERVICE: DragulaService,
  ) {}

  ngOnInit() {
    // Configure the drag n drop service
    this.DRAGULA_SERVICE.drop.subscribe(value => this.onDrop(value));
    this.toDoInit();
  } // End ngOnInit()

  ngOnDestroy() {
    // Unsubscribe to ensure no memory leaks or duplicate messages
    if (this.UTILS.hasValue(this.assignmentRowSelectedSubscription)) this.assignmentRowSelectedSubscription.unsubscribe();
  } // End ngOnDestroy()

  /**
   * Initializes the data in the ToDo component by retrieving
   * all the assignments, filtering them into complete and
   * incomplete arrays, and sorting them by how soon they are due
   */
  toDoInit(): void {
    this.newAssignment = new Assignment();
    this.newAssignment.setDueDate(null);
    this.completeAssignments = [];
    this.incompleteAssignments = [];

    // Fetch all the user's assignments
    this.ASSIGNMENTS.getAll()
      .then((assignments: Assignment[]) => {
        // Filter the assignments into complete and incomplete arrays
        assignments.forEach((assignment) => {
          if (assignment.getCompleted()) this.completeAssignments.push(assignment);
          else this.incompleteAssignments.push(assignment);
        });

        this.sortAllAssignments();
        this.assignmentFormInit();

        this.showList = true;
      }) // End then(assignments)
      .catch((getError: RemoteError) => {
        this.handleUnknownError(getError);
        this.assignmentFormInit();
        this.scrollToTop();
      }); // End this.ASSIGNMENTS.getAll()
  } // End toDoInit()

  /**
   * Receives a Dragula event and determines where
   * the event came from and the data it contained
   * @param {any[]} [_eventInfo = []] the drag or drop event from Dragula
   * @return {Object} a JSON containing the ID of the
   * assignment for the dragged element and where it was dropped
   */
  private getInfoFromDragulaEvent(_eventInfo: any[] = []): Object {
    const assignmentInfo = {};
    if (_eventInfo.length === 5) {
      const dropDiv = _eventInfo[2] || {};
      const dropDestination: string = dropDiv.id || '';

      const assignmentDiv = _eventInfo[1] || {};
      const assignmentId: string = assignmentDiv.id || '';

      assignmentInfo['assignmentId'] = assignmentId;
      assignmentInfo['dropDestination'] = dropDestination;
    }

    return assignmentInfo;
  } // End getInfoFromDragulaEvent()

  /**
   * Handles a drop event from the Dragula service to
   * try and update an assignment's completed value
   * @param {any[]} [_dropInfo = []] the dragula information from the drop event
   */
  private onDrop(_dropInfo: any[] = []): void {
    /*
     * Get the index of the dropped assignment in
     * the original array and where it was dropped
     */
    const assignmentInfo: Object = this.getInfoFromDragulaEvent(_dropInfo);

    let assignmentsSource: Assignment[];
    let assignmentsDestination: Assignment[]
    const destinationIsCompletedList: boolean = assignmentInfo['dropDestination'] === 'complete';

    if (destinationIsCompletedList) {
      assignmentsSource = this.incompleteAssignments;
      assignmentsDestination = this.completeAssignments;
    } else {
      assignmentsSource = this.completeAssignments;
      assignmentsDestination = this.incompleteAssignments;
    }

    // Find the assignment object and try to update it
    const assignmentIndex: number = assignmentsSource.findIndex(a => a.getId() === assignmentInfo['assignmentId']);
    if (assignmentIndex !== -1) {
      const assignment: Assignment = assignmentsSource[assignmentIndex];
      this.ASSIGNMENTS.updateCompleted(assignment.getId(), !assignment.getCompleted())
        .then(() => {
          // Update the local assignment object
          assignment.setCompleted(!assignment.getCompleted());
          this.disableEditing(assignment);

          // Remove the assignment from the array that it was originally in
          assignmentsSource = assignmentsSource.splice(assignmentIndex, 1);

          // Add the assignment into the right place in the array that it was dropped into
          let insertIndex: number;
          for (insertIndex = 0; insertIndex < assignmentsDestination.length; insertIndex++) {
            if (assignment.getDueDate() < assignmentsDestination[insertIndex].getDueDate()) break;
          }

          assignmentsDestination.splice(insertIndex, 0, assignment);

          // Refresh the appropriate list
          if (assignment.getCompleted()) {
            this.refreshCompletedList();
            this.displayCompletedListSuccess();
            this.scrollToTop();
          } else this.refreshIncompleteList();
        }) // End then()
        .catch((error: RemoteError) => {
          if (this.ERROR.isResourceDneError(error)) {
            if (destinationIsCompletedList) {
              this.displayIncompleteListError(this.errors['assignmentDoesNotExist']['defaultMessage']);
              this.refreshIncompleteList();
            } else {
              this.displayCompletedListError(this.errors['assignmentDoesNotExist']['defaultMessage']);
              this.refreshCompletedList();
            }

            this.deleteLocalAssignment(assignment);
          } else {
            this.handleUnknownError(error);

            if (destinationIsCompletedList) this.refreshIncompleteList();
            else this.refreshCompletedList();
          }

          this.scrollToTop();
        }); //  End this.ASSIGNMENTS.updateCompleted()
    }
  } // End onDrop()

  /**
   * Displays an error within the completed section of the to do component
   * @param {string} _message the error message to display
   * @param {number} _duration the number of seconds to display the error for
   */
  displayCompletedListError(_message?: string, _duration?: number): void {
    this.errors['completedAssignments']['occurred'] = true;
    this.errors['completedAssignments']['message'] = _message || this.errors['completedAssignments']['defaultMessage'];

    const duration: number = typeof _duration === 'number' ? _duration * 1000 : this.defaultMessageDisplayTime;
    setTimeout(
      () => {
        this.errors['completedAssignments']['occurred'] = false;
        this.errors['completedAssignments']['message'] = '';
      },
      duration);
  } // End displayCompletedListError()

  /**
  * Displays an error within the incomplete section of the to do component
   * @param {string} _message the error message to display
   * @param {number} _duration the number of seconds to display the error for
   */
  displayIncompleteListError(_message?: string, _duration?: number): void {
    this.errors['incompleteAssignments']['occurred'] = true;
    this.errors['incompleteAssignments']['message'] = _message || this.errors['incompleteAssignments']['defaultMessage'];

    const duration: number = typeof _duration === 'number' ? _duration * 1000 : this.defaultMessageDisplayTime;
    setTimeout(
      () => {
        this.errors['incompleteAssignments']['occurred'] = false;
        this.errors['incompleteAssignments']['message'] = '';
      },
      duration);
  } // End displayIncompleteListError()

  /**
   * Forces a UI update of the completed section of the to do component
   */
  refreshCompletedList(): void {
    const completeAssignments: Assignment[] = this.completeAssignments;
    this.completeAssignments = [];
    setTimeout(() => this.completeAssignments = completeAssignments, 1);
  } // End refreshCompletedList()

  /**
   * Forces a UI update of the incomplete section of the to do component
   */
  refreshIncompleteList(): void {
    const incompleteAssignments: Assignment[] = this.incompleteAssignments;
    this.incompleteAssignments = [];
    setTimeout(() => this.incompleteAssignments = incompleteAssignments, 1);
  } // End refreshIncompleteList()

  /**
   * Forces a UI update of both the completed and
   * incomplete sections of the to do component
   */
  refreshToDoLists(): void {
    this.showList = false;
    setTimeout(() => this.showList = true, 1);
  } // End refreshToDoLists()

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
    if (isClass) $('html, body').animate({ scrollTop: $(_identifier).first().offset().top }, duration);
    else $('html, body').animate({ scrollTop: $(_identifier).offset().top }, duration);
  } // End scrollToElement()

  /**
   * Scrolls to the top of the HTML page with animation
   * @param {number} _duration the number of
   * milliseconds for the animation to last
   */
  scrollToTop(_duration?: number): void {
    this.scrollToElement('#date-view', _duration);
  } // End scrollToTop()

  /**
   * Sends a message to subscribers about the assignment and row
   * that was chosen in the incomplete section of the ToDo component
   * @param {Assignment} _assignment the
   * assignment for the given row that was clicked
   * @param {number} _index the 0-based index representing the row that
   * was clicked on in the row of assignments in the incomplete section
   */
  publishDatePick(_assignment: Assignment, _index: number): void {
    this.MESSAGING.publish(new TaskDatePicked(_assignment, _index));
  } // End publishDatePick

  /**
   * Configures the functions that are called when form
   * elements for the assignments are clicked on. NOTE: Must be
   * called every time one of the rows in the table is updated
   */
  assignmentFormInit(): void {
    const self = this;
    $(document).ready(function () {
      $('#select').material_select();
      $('#select').on('change', function (e) {
        const selected = e.currentTarget.selectedOptions[0].value;
        self.STORAGE.setItem('type', selected);
        $('#select').prop('selectedIndex', 0); // Sets the first option as selected
      });

      // Holds the message that will be received when the date picker for existing assignments is open
      let assignmentRowMessage;
      const onOpenForExistingAssignment: Function = () => {
        /*
         * When the date picker opens, subscribe to receive a message
         * about which index was clicked on to open the date picker
         */
        self.assignmentRowSelectedSubscription = self.MESSAGING.messagesOf(TaskDatePicked)
          .subscribe(message => assignmentRowMessage = message);
      };

      const onCloseForExistingAssignment: Function = () => {
        // Unsubscribe to ensure no memory leaks or receiving of old messages
        if (self.UTILS.hasValue(self.assignmentRowSelectedSubscription)) self.assignmentRowSelectedSubscription.unsubscribe();
      };

      const onSetForExistingAssignment: Function = (context) => {
        let index: number;
        let assignment: Assignment;

        // Try and get the data from the message that was sent when the date picker was opened
        if (
          self.UTILS.hasValue(assignmentRowMessage) &&
          self.UTILS.hasValue(assignmentRowMessage.getIndex()) &&
          self.UTILS.hasValue(assignmentRowMessage.getAssignment())
        ) {
          index = assignmentRowMessage.getIndex();
          assignment = assignmentRowMessage.getAssignment();
        } else {
          index = -1;
          assignment = null;
        }

        // Check if the user clicked on an actual date, not a range selection
        if (self.UTILS.hasValue(context.select)) {
          if (index !== -1 && self.UTILS.hasValue(assignment)) {
            // Create a date from the selected day and set the time to 12 pm
            const unixMilliseconds12Hours: number = 43200000;
            const unixMilliseconds: number = context.select;
            const newDueDate: Date = new Date(unixMilliseconds + unixMilliseconds12Hours);

            // Update the Assignment's due date because it isn't in a valid format when first created
            if (assignment.getCompleted()) self.completeAssignments[index].setDueDate(newDueDate)
            else self.incompleteAssignments[index].setDueDate(newDueDate);
          }
        } else {
          // Reset the assignment's due date in the HTML form
          self.incompleteAssignments[index].setDueDate(null);
          setTimeout(() => self.incompleteAssignments[index].setDueDate(self.incompleteAssignments[index].getDueDate()));
        }
      };

      const onSetForNewAssignment: Function = (context) => {
        // Check if the user clicked on an actual date, not a range selection
        if (self.UTILS.hasValue(context.select)) {
          // Create a date from the selected day and set the time to 12 pm
          const unixMilliseconds12Hours: number = 43200000;
          const unixMilliseconds: number = context.select;
          const newDueDate: Date = new Date(unixMilliseconds + unixMilliseconds12Hours);

          // Update the assignment's due date because it isn't in a valid format when first created
          self.newAssignment.setDueDate(newDueDate);
        } else if (context.hasOwnProperty('clear')) {
          // The clear button was pressed
          self.newAssignment.setDueDate(null);
        }
      };

      self.configureDatePicker(
        '.existingAssignmentDatePicker',
        onOpenForExistingAssignment,
        onSetForExistingAssignment,
        onCloseForExistingAssignment);

      self.configureDatePicker('.newAssignmentDatePicker', null, onSetForNewAssignment, null);
    });
  } // End assignmentFormInit()

  /**
   * Configures a jQuery date picker with standard date
   * options and the option of custom 'on' event functions
   * @param {string} [_identifier = ''] the HTML
   * tag identifier for the date picker element
   * @param {Function} _onOpen a custom onOpen function
   * @param {Function} _onSet a custom onSet
   * function, requires one parameter/argument
   * @param {Function} _onClose a custom onClose function
   * @return {Object} the date picker object
   */
  configureDatePicker(_identifier: string = '', _onOpen: Function, _onSet: Function, _onClose: Function) {
    const input = $(_identifier).pickadate({
      onOpen: _onOpen,
      onSet: _onSet,
      onClose: _onClose,

      // Set the min selectable date as 01/01/1970
      min: new Date(1970, 0, 1),

      // Max date is not constrained
      max: false,

      // Creates a dropdown to quick select the month
      selectMonths: true,

      // Creates a dropdown of 25 years at a time to quick select the year
      selectYears: 25,

      // Display format once a date has been selected
      format: 'dddd, mmmm d, yyyy',

      // Date format that is provided to the onSet method
      formatSubmit: 'yyyy/mm/dd',

      // Ensures that submitted format is used in the onSet method, not regular format
      hiddenName: true,
    });

    return input.pickadate('picker');
  } // End getDefaultDatePicker()

  /**
   * Adds an assignment to the user's assignments by sending a request to the API
   */
  addAssignment(): void {
    const invalidTitle: boolean = !this.UTILS.hasValue(this.newAssignment.getTitle()) || this.newAssignment.getTitle().trim() === '';
    const invalidDueDate: boolean = !this.UTILS.hasValue(this.newAssignment.getDueDate());
    if (invalidTitle || invalidDueDate) {
      let errorMessage: string = 'Your new assignment needs a ';
      if (invalidTitle && !invalidDueDate) errorMessage += 'title.';
      else if (invalidDueDate && !invalidTitle) errorMessage += 'due date.';
      else errorMessage += 'title and due date.';

      this.displayIncompleteListError(errorMessage, 7.5);
      this.scrollToTop();
    } else {
      this.newAssignment.setCompleted(false);
      this.ASSIGNMENTS.create(this.newAssignment)
        .then((newAssignment: Assignment) => {
          if (this.errors['incompleteAssignments']['occurred']) this.resetIncompleteError();
          if (this.errors['general']['occurred']) this.resetToDoError();

          this.displayCreateAssignmentSuccess();
          this.scrollToTop();

          // Insert the new assignment into the correct place in the incomplete assignments
          let insertIndex: number;
          for (insertIndex = 0; insertIndex < this.incompleteAssignments.length; insertIndex++) {
            if (newAssignment.getDueDate() < this.incompleteAssignments[insertIndex].getDueDate()) break;
          }

          this.incompleteAssignments.splice(insertIndex, 0, newAssignment);

          // Reset the default assignment for the form
          this.newAssignment = new Assignment();
          $('#createAssignmentForm').trigger('reset');
          this.assignmentFormInit();
        }) // End then(newAssignment)
        .catch((createError: Error) => {
          if (this.ERROR.isInvalidRequestError(createError) || createError instanceof LocalError) {
            const invalidParams: string[] = createError.getCustomProperty('invalidParameters') || [];

            let errorMessage: string;
            const length: number = invalidParams.length;
            if (length === 0) errorMessage = 'Your assignment is invalid.';
            else if (length === 1) errorMessage = `Your assignment's ${this.varToWordMap[invalidParams[0]]} is invalid.`;
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
              errorMessage = `Your assignment's ${invalidParamsSubset.join(', ')}${possibleComma} and ${prettyInvalidParams[length - 1]} are invalid.`;
              /* tslint:enable max-line-length */
            }

            this.scrollToTop();
            this.displayIncompleteListError(errorMessage, 7.5);
          } else this.handleUnknownError(createError as RemoteError);
        }); // End this.ASSIGNMENTS.create()
    }
  } // End addAssignment()

  /**
   * Determines whether or not the type of the assignments
   * should be displayed based on the quick settings value
   * @return {boolean} whether or not to display the assignment type
   */
  displayTaskTypeLabel(): boolean {
    return this.STORAGE.getItem('qsLabel') === 'true';
  } // End displayTaskTypeLabel()

  /**
   * Determines whether or not the description of the assignments
   * should be displayed based on the quick settings value
   * @return {boolean} whether or not to display the assignment description
   */
  displayTaskDescriptionLabel(): boolean {
    return this.STORAGE.getItem('qsDescription') === 'true';
  } // End displayTaskDescriptionLabel();

  /**
   * Sends a request to delete an assignment through the API
   * @param {Assignment} _assignment the assignment to delete
   */
  deleteRemoteAssignment(_assignment: Assignment): void {
    this.disableEditing(_assignment);
    this.ASSIGNMENTS.delete(_assignment.getId())
      .then(() => this.deleteLocalAssignment(_assignment))
      .catch((deleteError: RemoteError) => {
        if (this.ERROR.isResourceDneError(deleteError)) {
          if (_assignment.getCompleted()) this.displayCompletedListError(this.errors['assignmentDoesNotExist']['defaultMessage']);
          else this.displayIncompleteListError(this.errors['assignmentDoesNotExist']['defaultMessage']);

          this.deleteLocalAssignment(_assignment);
        } else this.handleUnknownError(deleteError);

        this.scrollToTop();
      });
  } // End deleteRemoteAssignment()

  /**
   * Removes an assignment from it's respective array
   * based on whether it is completed or incomplete
   * @param {Assignment} _assignment the assignment to delete
   */
  deleteLocalAssignment(_assignment: Assignment): void {
    if (this.UTILS.hasValue(_assignment)) {
      const assignments: Assignment[] = _assignment.getCompleted() ? this.completeAssignments : this.incompleteAssignments;
      const index: number = assignments.indexOf(_assignment);
      if (index !== -1) assignments.splice(index, 1);
    }
  } // End deleteLocalAssignment()

  /**
   * Enables an assignment within the HTML to be edited
   * @param {Assignment} assignment the assignment to enable editing for
   * @param {number} index the index of the assignment
   * in it's respective array (incomplete or complete)
   */
  enableEdit(_assignment: Assignment, _index: number): void {
    // If an assignment is completed, don't allow it to be edited
    if (this.UTILS.hasValue(this.assignmentCopy)) this.disableEditing(this.assignmentCopy);
    if (!_assignment.getCompleted()) {
      // Deep copy the assignment to save it's state before it is edited
      this.assignmentCopy = _assignment.deepCopy();

      const id: string = `#titleEdit${_index}`;
      this.enableEditing(_assignment);
      setTimeout(() => $(id).focus(), 1);
    }
  } // End enableEdit()

  /**
   * Updates an assignment's title by making a service request to the
   * API. If the assignment's title is unchanged, the promise is resolved
   * immediately with a boolean false value. If the request succeeds,
   * the promise is resolved with a string value 'title'. If the request
   * is denied, the promise is rejected with a RemoteError object
   * @param {Assignment} _oldAssignment the assignment
   * object before it was updated (should be a deep copy
   * of _newAssignment before any updates were made)
   * @param {Assignment} _newAssignment the assignment
   * to update with all edits already applied
   * @return {Promise<any>} the value indicating success or failure
   * after the service is called to update the assignment's title
   */
   updateTitle(_oldAssignment: Assignment, _newAssignment: Assignment): Promise<any> {
     const unchangedTitle: boolean = _newAssignment.getTitle() === _oldAssignment.getTitle();
     const promise = new Promise((resolve, reject) => {
       if (unchangedTitle) Promise.resolve(false);
       else {
         this.ASSIGNMENTS.updateTitle(_newAssignment.getId(), _newAssignment.getTitle())
           .then(() => Promise.resolve('title'))
           .catch((updateError: RemoteError) => {
             const updatedUpdateError: RemoteError = this.handleUpdateError(updateError, 'title');
             return Promise.reject(updatedUpdateError);
           }); // End this.ASSIGNMENTS.updateTitle()
       }
     });

    return promise;
  } // End updateTitle()

  /**
   * Updates an assignment's due date by making a service request to
   * the API. If the assignment's due date is unchanged, the promise
   * is resolved immediately with a boolean false value. If the request
   * succeeds, the promise is resolved with a string value 'dueDate'. If the
   * request is denied, the promise is rejected with a RemoteError object
   * @param {Assignment} _oldAssignment the assignment
   * object before it was updated (should be a deep copy
   * of _newAssignment before any updates were made)
   * @param {Assignment} _newAssignment the assignment
   * to update with all edits already applied
   * @return {Promise<any>} the value indicating success or failure
   * after the service is called to update the assignment's due date
   */
   updateDueDate(_oldAssignment: Assignment, _newAssignment: Assignment): Promise<any> {
     const unchangedDueDate: boolean = _newAssignment.getDueDateInUnixMilliseconds() === _oldAssignment.getDueDateInUnixMilliseconds();
     const promise = new Promise((resolve, reject) => {
       if (unchangedDueDate) Promise.resolve(false);
       else {
         this.ASSIGNMENTS.updateDueDate(_newAssignment.getId(), _newAssignment.getDueDate())
           .then(() => Promise.resolve('dueDate'))
           .catch((updateError: RemoteError) => {
             const updatedUpdateError: RemoteError = this.handleUpdateError(updateError, 'dueDate');
             return Promise.reject(updatedUpdateError);
           }); // End this.ASSIGNMENTS.updateDueDate()
       }
     });

     return promise;
  } // End updateDueDate()

  /**
   * Updates an assignment's type by making a service request to the
   * API. If the assignment's type is unchanged, the promise is resolved
   * immediately with a boolean false value. If the request succeeds,
   * the promise is resolved with a string value 'type'. If the request
   * is denied, the promise is rejected with a RemoteError object
   * @param {Assignment} _oldAssignment the assignment
   * object before it was updated (should be a deep copy
   * of _newAssignment before any updates were made)
   * @param {Assignment} _newAssignment the assignment
   * to update with all edits already applied
   * @return {Promise<any>} the value indicating success or failure
   * after the service is called to update the assignment's type
   */
   updateType(_oldAssignment: Assignment, _newAssignment: Assignment): Promise<any> {
     const unchangedType: boolean = _newAssignment.getType() === _oldAssignment.getType();
     const promise = new Promise((resolve, reject) => {
       if (unchangedType) Promise.resolve(false);
       else {
         this.ASSIGNMENTS.updateType(_newAssignment.getId(), _newAssignment.getType())
           .then(() => Promise.resolve('type'))
           .catch((updateError: RemoteError) => {
             const updatedUpdateError: RemoteError = this.handleUpdateError(updateError, 'type');
             return Promise.reject(updatedUpdateError);
           }); // End this.ASSIGNMENTS.updateType()
       }
     });

     return promise;
  } // End updateType()

  /**
   * Updates an assignment's description by making a service request to
   * the API. If the assignment's description is unchanged, the promise
   * is resolved immediately with a boolean false value. If the request
   * succeeds, the promise is resolved with a string value 'description'. If
   * the request is denied, the promise is rejected with a RemoteError object
   * @param {Assignment} _oldAssignment the assignment
   * object before it was updated (should be a deep copy
   * of _newAssignment before any updates were made)
   * @param {Assignment} _newAssignment the assignment
   * to update with all edits already applied
   * @return {Promise<any>} the value indicating success or failure
   * after the service is called to update the assignment's description
   */
   updateDescription(_oldAssignment: Assignment, _newAssignment: Assignment): Promise<any> {
     const unchangedDescription: boolean = _newAssignment.getDescription() === _oldAssignment.getDescription();
     const promise = new Promise((resolve, reject) => {
       if (unchangedDescription) Promise.resolve(false);
       else {
         this.ASSIGNMENTS.updateDescription(_newAssignment.getId(), _newAssignment.getDescription())
           .then(() => Promise.resolve('description'))
           .catch((updateError: RemoteError) => {
             const updatedUpdateError: RemoteError = this.handleUpdateError(updateError, 'description');
             return Promise.reject(updatedUpdateError);
           }); // End this.ASSIGNMENTS.updateDescription()
       }
     });

     return promise;
  } // End updateDescription()

  /**
   * Cancels the editing of a task and resets the assignment's
   * attributes to what they were before editing began
   * @param {Assignment} _assignment the assignment that was edited
   * @param {number} _index the index of the assignment in it's respective array
   */
  cancelEditingTask(_assignment: Assignment, _index: number): void {
    if (this.UTILS.hasValue(this.assignmentCopy) && _index >= 0 && _index < this.incompleteAssignments.length) {
      const oldAssignment: Assignment = this.assignmentCopy.deepCopy();
      this.disableEditing(oldAssignment);
      this.incompleteAssignments[_index] = oldAssignment;
      this.assignmentCopy = null;
    }

    this.assignmentFormInit();
  } // End cancelEditingTask()

  /**
   * Updates a task's changed attributes by making a service request to the API
   * @param {Assigment} _assignment the task to update
   * @param {number} _index the index of the assignment in it's respective array
   */
  updateTask(_assignment: Assignment, _index: number): void {
    this.disableEditing(_assignment);

    const invalidTitle: boolean = !this.UTILS.hasValue(_assignment.getTitle()) || _assignment.getTitle().trim() === '';
    const invalidDueDate: boolean = !this.UTILS.hasValue(_assignment.getDueDate());

    if (invalidTitle || invalidDueDate) {
      let errorMessage: string = 'Your assignment needs a ';
      if (invalidTitle && !invalidDueDate) {
        errorMessage += 'title';
        this.incompleteAssignments[_index].setTitle(this.assignmentCopy.getTitle());
      } else if (invalidDueDate && !invalidTitle) {
        errorMessage += 'due date';

        // this.assignmentFormInit();
        this.incompleteAssignments[_index].setDueDate(this.assignmentCopy.getDueDate());
      } else {
        errorMessage += 'title and due date';

        // this.assignmentFormInit();
        this.incompleteAssignments[_index].setTitle(this.assignmentCopy.getTitle());
        this.incompleteAssignments[_index].setDueDate(this.assignmentCopy.getDueDate());
      }

      this.displayIncompleteListError(errorMessage, 7.5);
      this.scrollToTop();
    } else {
      // Updated fields are validated locally. Create promise variables to hold promises of service requests to update the assignment
      const updateTitlePromise = this.updateTitle(this.assignmentCopy, _assignment);
      const updateDueDatePromise = this.updateDueDate(this.assignmentCopy, _assignment);
      const updateTypePromise = this.updateType(this.assignmentCopy, _assignment);
      const updateDescriptionPromise = this.updateDescription(this.assignmentCopy, _assignment);

      // Execute all the promises and make sure they all finish, even if some get rejected
      const promises = [
        updateTitlePromise.catch(e => e),
        updateDueDatePromise.catch(e => e),
        updateTypePromise.catch(e => e),
        updateDescriptionPromise.catch(e => e),
      ];

      Promise.all(promises)
        .then((resolutions: any[]) => {
          // Determine if there are any errors when the promises are all resolved or rejected
          const errors: RemoteError[] = resolutions.filter(resolution => resolution instanceof RemoteError);
          const unknownErrors: RemoteError[] = errors.filter(error => error.getCustomProperty('unknownError'));

          if (unknownErrors.length > 0) {
            this.handleUnknownError();
            this.scrollToTop();
            this.refreshIncompleteList();
            this.enableEditing(_assignment);
            unknownErrors.forEach(unknownError => console.error(unknownError));
          } else if (errors.length > 0) {
            const errorMessages: string[] = errors.map(error => error.getCustomProperty('detailedErrorMessage'));
            const errorMessage: string = errorMessages.join('. ') + '.';

            this.displayIncompleteListError(errorMessage, 7.5);
            this.scrollToTop();
            this.refreshIncompleteList();
            this.enableEditing(_assignment);
          } else {
            // No errors occurred so reset any previous errors
            this.resetIncompleteError();

            // Check if attributes were actually updated
            const actuallyUpdated: string[] = resolutions.filter(resolution => typeof resolution === 'string');
            if (actuallyUpdated.length > 0) {
              // TODO: Display inline success icon

              // If the due date was updated, re-sort the list
              if (actuallyUpdated.some(attribute => attribute === 'dueDate')) {
                this.sortIncompleteAssignments();
                this.refreshIncompleteList();
              }
            } else console.log('Didn\'t actually update anything');

            this.assignmentFormInit();
          }
        }) // End then(resolutions)
        .catch(unhandledError => this.handleUnknownError(unhandledError));
      }
  } // End updateTask()

  /**
   * Handles remote errors from the API that are
   * received when an update to an assignment fails
   * @param {RemoteError} _error the remote error that contains
   * information about why updating the assignment failed
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
      if (unchangedParams.length > 0) errorMessage = `Your assignment\'s ${prettyAttribute} is unchanged`;
      else unknownError = true;
    } else if (this.ERROR.isResourceDneError(updateError)) errorMessage = this.errors['assignmentDoesNotExist']['defaultMessage'];
    else unknownError = true;

    if (unknownError) updateError.setCustomProperty('unknownError', true);
    else updateError.setCustomProperty('detailedErrorMessage', errorMessage);

    return updateError;
  } // End handleUpdateError()

  /**
   * Enables editing for any of an assignment's attributes through the HTML form
   * @param {Assignment} _assignment the assignment to enable editing for
   */
  enableEditing(_assignment: Assignment): void {
    if (this.UTILS.hasValue(_assignment) && _assignment instanceof Assignment) {
      _assignment.setEditModeType(true);
      _assignment.setEditModeDate(true);
      _assignment.setEditModeTitle(true);
      _assignment.setEditModeDescription(true);
    }
  } // End enableEditing()

  /**
   * Disables editing for any of an assignment's attributes through the HTML form
   * @param {Assignment} _assignment the assignment to disable editing for
   */
  disableEditing(_assignment: Assignment): void {
    if (this.UTILS.hasValue(_assignment) && _assignment instanceof Assignment) {
      _assignment.setEditModeType(false);
      _assignment.setEditModeDate(false);
      _assignment.setEditModeTitle(false);
      _assignment.setEditModeDescription(false);
    }
  } // End disableEditing()

  /**
   * Sorts the completed assignments by their due date
   * @param {boolean} [_disableDoneSortingUpdates = false] Determines whether
   * or not the doneSorting class variable will be updated inside this method
   */
  sortCompletedAssignments(_disableDoneSortingUpdates: boolean = false): void {
    if (!_disableDoneSortingUpdates) this.doneSorting = false;
    this.ASSIGNMENTS.sort(this.completeAssignments);
    if (!_disableDoneSortingUpdates) this.doneSorting = true;
  } // End sortCompletedAssignments()

  /**
   * Sorts the completed assignments by their due date
   * @param {boolean} [_disableDoneSortingUpdates = false] Determines whether
   * or not the doneSorting class variable will be updated inside this method
   */
  sortIncompleteAssignments(_disableDoneSortingUpdates: boolean = false): void {
    if (!_disableDoneSortingUpdates) this.doneSorting = false;
    this.ASSIGNMENTS.sort(this.incompleteAssignments);
    if (!_disableDoneSortingUpdates) this.doneSorting = true;
  } // End sortIncompleteAssignments()

  /**
   * Sorts all assignments, complete and incomplete, by their due date
   */
  sortAllAssignments(): void {
    this.doneSorting = false;
    this.sortIncompleteAssignments(true);
    this.sortCompletedAssignments(true);
    this.doneSorting = true;
  } // End sortAllAssignments()

  /**
   * Resets any error in the completed section
   */
  resetCompletedError(): void {
    this.errors['completedAssignments']['occurred'] = false
    this.errors['completedAssignments']['message'] = '';
  } // End resetCompletedError()

  /**
   * Resets any error in the incomplete section
   */
  resetIncompleteError(): void {
    this.errors['incompleteAssignments']['occurred'] = false;
    this.errors['incompleteAssignments']['message'] = '';
  } // End resetIncompleteError()

  /**
   * Resets any error at the top of the to do component
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
  resetCreateAssignmentMessage(): void {
    this.success['assignmentCreated']['occurred'] = false;
    this.success['assignmentCreated']['message'] = '';
  } // End resetCreateAssignmentMessage()

  /**
   * Resets any message at the top of the completed section
   */
  resetCompleteAssignmentMessage(): void {
    this.success['completedAssignments']['occurred'] = false;
    this.success['completedAssignments']['message'] = '';
  } // End resetCompleteAssignmentMessage()

  /**
   * Displays a success message in the incomplete section
   * @param {string} _message a custom message to display. If no value is passed,
   * the default message for successfully creating an assignment will be used
   */
  displayCreateAssignmentSuccess(_message?: string): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : this.success['assignmentCreated']['defaultMessage'];
    this.success['assignmentCreated']['occurred'] = true;
    this.success['assignmentCreated']['message'] = message;
    setTimeout(() => this.resetCreateAssignmentMessage(), this.defaultMessageDisplayTime);
  } // End displayCreateAssignmentSuccess()

  /**
   * Displays a success message in the completed section
   * @param {string} _message a custom message to display. If no value is passed,
   * the default message for successfully completing an assignment will be used
   */
  displayCompletedListSuccess(_message?: string): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : this.success['completedAssignments']['defaultMessage'];
    this.success['completedAssignments']['occurred'] = true;
    this.success['completedAssignments']['message'] = message;
    setTimeout(() => this.resetCompleteAssignmentMessage(), this.defaultMessageDisplayTime);
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
      setTimeout(
        () => {
          this.errors['general']['occurred'] = false;
          this.errors['general']['message'] = '';
        },
        this.defaultMessageDisplayTime);
    }
  } // End handleUnknownError()
}
