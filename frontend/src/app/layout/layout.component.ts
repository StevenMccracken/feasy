// Import angular packages
import {
  OnInit,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

// Import 3rd party libraries
import { Subscription } from 'rxjs/Subscription';

// Import our files
import { Account } from '../objects/account';
import { Assignment } from '../objects/assignment';
import { UserService } from '../services/user.service';
import { AvatarService } from '../services/avatar.service';
import { MessageService } from '../services/message.service';
import { LoadLearnService } from '../services/load-learn.service';
import { AssignmentService } from '../services/assignment.service';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

// jQuery definition
declare var $: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  user: Account = new Account();
  firstName: string;
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

  loadNLearnError: boolean = false;
  loadNLearnErrorMessage: string;
  /* tslint:disable max-line-length */
  standardLoadNLearnErrorMessage: string = 'We are unable to create those assignments at this time. Please contact us at feasyresponse@gmail.com to fix this issue';
  /* tslint:enable max-line-length */

  constructor(
    private _router: Router,
    private _location: Location,
    private _userService: UserService,
    private _utils: CommonUtilsService,
    private _loadLearn: LoadLearnService,
    private _storage: LocalStorageService,
    private _avatarService: AvatarService,
    private _messageService: MessageService,
    private _assignmentService: AssignmentService,
  ) {}

  sendMessage(): void {
    // send message to subscribers via observable subject
    this._messageService.sendMessage('changed');
  }

  clearMessage(): void {
    // clear message
    this._messageService.clearMessage();
  }

  ngOnInit() {
    this.taskArray[0] = new Assignment();
    $('#button-slide').sideNav();
    if (this._storage.isValidItem('qsColor')) this.quickSettingColors = this._storage.getItem('qsColor') === 'true';
    if (this._storage.isValidItem('qsDescription')) this.quickSettingDescription = this._storage.getItem('qsDescription') === 'true';
    if (this._storage.isValidItem('qsLabel')) this.quickSettingLabel = this._storage.getItem('qsLabel') === 'true';

    const currentUser: string = this._storage.getItem('currentUser');
    this._userService.get(currentUser)
      .then((userAccount: Account) => {
        this.user = userAccount;
        if (this._utils.hasValue(this.user.firstName) && this.user.firstName !== '') {
          this.firstName = this.user.firstName.charAt(0).toUpperCase() + this.user.firstName.slice(1);
        } else this.firstName = this.user.username;

        this.avatarUrl = this._avatarService.getAvatarUrl(this.user.avatar);
      })
      .catch((getError: Response) => {
        if (getError.status === 400 || getError.status === 403) {
          this.firstName = 'User';
          console.error(getError);
        } else this.handleError(getError);
      });
  }

  logout(): void {
    this._storage.deleteItem('token');
    this._storage.deleteItem('currentUser');
    $('#button-slide').sideNav('destroy');
    this._router.navigate(['login']);
  }

  closeNav(link: string): void {
    $('#button-slide').sideNav('hide');
    if (link === '/main/calendar') this._router.navigate([link]);
  }

  toggleSettings(_type: string): void {
    switch (_type) {
      case 'color':
        setTimeout(() => this._storage.setItem('qsColor', this.quickSettingColors.toString()), 300);
        break;
      case 'label':
        setTimeout(() => this._storage.setItem('qsLabel', this.quickSettingLabel.toString()), 300);
        break;
      case 'description':
        setTimeout(() => this._storage.setItem('qsDescription', this.quickSettingDescription.toString()), 300);
        break;
      default:
        console.log('Can\'t toggle unknown settings type \'%s\'', _type);
    }
  }

  addMore(): void {
    const size = this.taskArray.length;
    this.taskArray[size] = new Assignment();
  }

  deleteCurrent(i: number): void {
    this.taskArray.splice(i, 1);
  }

  changeAvatar(): void {
    // Populate all the possible avatars
    this.avatars = this._avatarService.getAllAvatars();

    // Make sure no errors are displayed
    this.avatarError = false;
    this.avatarErrorMessage = '';

    // Open the avatar selction screen
    $('#avatarSelect').modal('open');
  }

  updateAvatar(_url: string, _type: string): void {
    if (_url === this.avatarUrl) {
      // Display error message
      this.avatarError = true;
      this.avatarErrorMessage = this.avatarErrorDuplicateMessage;

      // Scroll to top of modal to make error message visible
      $('#avatarSelect').scrollTop(0);
    } else {
      this.avatarError = false;
      this._userService.updateAvatar(_type)
        .then(() => {
          this.avatarUrl = _url;
          $('#avatarSelect').modal('close');
        })
        .catch((updateError: any) => {
          // Scroll to top of modal to make error message visible
          $('#avatarSelect').scrollTop(0);

          if (typeof updateError === 'string') this.handleUpdateError('avatar', updateError);
          else this.handleError(updateError);

          // handleError handles 500 errors, but does not update the UI for avatars. Update the UI separately
          if (updateError.status === 500) {
            // API error, server could be down/crashed
            this.avatarError = true;
            this.avatarErrorMessage = this.standardAvatarErrorMessage;
          }
        });
    }
  }

  /**
   * Handles error that comes during an update API call
   * @param {string} _attribute a part of the object that couldn't be updated
   * @param {string} _reason why the attribute couldn't be updated.
   */
  private handleUpdateError(_attribute: string, _reason: string): void {
    this.avatarError = true;
    switch (_reason) {
      case 'invalid':
        console.error('New %s was malformed', _attribute);
        this.avatarErrorMessage = this.standardAvatarErrorMessage;
        break;
      case 'unchanged':
        console.error('New %s was unchanged', _attribute);
        this.avatarErrorMessage = this.avatarErrorDuplicateMessage;
        break;
      default:
        console.error('New %s was invalid in some way', _attribute);
        this.avatarErrorMessage = this.standardAvatarErrorMessage;
    }
  }

  openLoadLearn(): void {
    $('#loadLearn').modal('open');
  }

  addAllTask(): void {
    // Clear any previous error messages
    this.loadNLearnError = false;
    this.loadNLearnErrorMessage = '';

    // Correct the date format for the assignments from the form
    const assignments: Assignment[] = this.taskArray.map((assignment) => {
      // Set the time to be at 12 pm on the given day for the due date
      const unixMillis = Date.parse(String(assignment.dueDate));
      assignment.dueDate = new Date(unixMillis + 43200000);

      return assignment;
    });

    // Create the assignments all at once
    this._assignmentService.bulkCreate(assignments)
      .then((createdAssignments: Assignment[]) => {
        $('#loadLearn').modal('close');

        // Clear any previous messages for the message service
        this.clearMessage();

        // Add the saved assignments to the load n learn service
        this._loadLearn.setTaskArray(createdAssignments);

        // Reset the task array
        this.taskArray = [];
        this.taskArray[0] = new Assignment();

        // Notify all listeners that the load n learn service has the created assignments
        this.sendMessage();

        // Navigate back to the calendar component
        this.closeNav('/main/calendar');
      })
      .catch((bulkCreateError: any) => {
        this.loadNLearnError = true;
        this.loadNLearnErrorMessage = this.standardLoadNLearnErrorMessage;
        console.error(bulkCreateError);
      }); // End this._assignmentService.bulkCreate()
  }

  /**
   * Handles errors received from an API call
   * @param {Response = new Response()} _error the Response error from the API call
   */
  private handleError(_error: Response = new Response()): void {
    if (_error.status === 401 || _error.status === 404) {
      // Token is stale. Clear the user and token local storage
      this._storage.deleteItem('token');
      this._storage.deleteItem('currentUser');

      // Add the reason for re-routing to login
      if (_error.status === 401) this._storage.setItem('expiredToken', 'true');
      else if (_error.status === 404) this._storage.setItem('userDoesNotExist', 'true');

      // Route to the login page
      this._router.navigate(['/login']);
    } else {
      // API error, server could be down/crashed
      console.error(_error);
    }
  }

  debug(): void {
    console.log(this._storage.getItem('qsDescription'));
  }
}
