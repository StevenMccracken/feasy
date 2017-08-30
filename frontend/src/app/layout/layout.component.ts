import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs/Subscription';
import { Component, OnInit } from '@angular/core';

import { Account } from '../objects/user';
import { Assignment } from '../objects/assignment';
import { UserService } from '../services/user.service';
import { MessageService } from '../services/message.service';
import { LoadLearnService } from '../services/load-learn.service';
import { AssignmentService } from '../services/assignment.service';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

declare var $: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  user: Account = new Account();
  firstName: string;

  taskArray: Assignment[] = [];
  testArray: Assignment[] = [];

  //quicksettings variables
  quickSettingDescription: boolean = true;
  quickSettingLabel: boolean = true;
  quickSettingColors: boolean = false;
  connectionMade: boolean = false;

  currentLocation: string;


  constructor(
    private _router: Router,
    private _location: Location,
    private _userService: UserService,
    private _utils: CommonUtilsService,
    private _loadLearn: LoadLearnService,
    private _storage: LocalStorageService,
    private _messageService: MessageService,
    private _assignmentService: AssignmentService
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
    $("#button-slide").sideNav();
    if(this._storage.isValidItem('qsColor')) {
      this.quickSettingColors = this._storage.getItem('qsColor') === 'true';
    }

    if(this._storage.isValidItem('qsDescription')) {
      this.quickSettingDescription = this._storage.getItem('qsDescription') === 'true';
    }

    if(this._storage.isValidItem('qsLabel')) {
      this.quickSettingLabel = this._storage.getItem('qsLabel') === 'true';
    }

    let currentUser: string = this._storage.getItem('currentUser');
    this._userService.get(currentUser)
      .then((userAccount: Account) => {
        this.user = userAccount;
        if (this._utils.hasValue(this.user.firstName) && this.user.firstName !== '') {
          this.firstName = this.user.firstName.charAt(0).toUpperCase() + this.user.firstName.slice(1);
        } else this.firstName = this.user.username;
      })
      .catch((getError: Response) => {
        if (getError.status == 400 || getError.status == 403) {
          this.firstName = 'User';
          console.error(getError);
        } else this.handleError(getError);
      });
  }

  logout(): void {
    this._storage.deleteItem('token');
    this._storage.deleteItem('currentUser');
    $("#button-slide").sideNav('destroy');
    this._router.navigate(['login']);
  }

  closeNav(link: string): void {
    $('#button-slide').sideNav('hide');
    if (link === '/main/calendar') this._router.navigate([link]);
  }

  toggleSettings(type: string): void {
    if (type === 'color') {
      setTimeout(() => this._storage.setItem('qsColor', this.quickSettingColors.toString()), 300);
    }

    if (type === 'label') {
      setTimeout(() => this._storage.setItem('qsLabel', this.quickSettingLabel.toString()), 300);
    }

    if (type === 'description') {
      setTimeout(() => {
        this._storage.setItem('qsDescription', this.quickSettingDescription.toString());
      } , 300);
    }
  }
  addMore(): void{
    let size = this.taskArray.length;
    this.taskArray[size] = new Assignment();
  }

  deleteCurrent(i: number): void{
    this.taskArray.splice(i, 1);
  }

  openLoadLearn(): void{
    $('#loadLearn').modal('open');
  }

  addAllTask(): void{
    $('#loadLearn').modal('close');
    console.log(this.taskArray);
    this._assignmentService.multipleCreate(this.taskArray)
                           .then((res: Assignment[]) => {
                             this.clearMessage();
                             this.sendMessage();
                             this._loadLearn.setTaskArray(this.taskArray);
                             this.taskArray = [];
                             this.taskArray[0] = new Assignment();
                           })
                           .catch((err: any) => {
                             console.log(err);
                           });
  }
  /**
   * Handles errors received from an API call
   * @param {Response = new Response()} _error the Response error from the API call
   */
  private handleError(_error: Response = new Response()): void {
    if (_error.status == 401 || _error.status == 404) {
      // Token is stale. Clear the user and token local storage
      this._storage.deleteItem('token');
      this._storage.deleteItem('currentUser');

      // Add the reason for re-routing to login
      if (_error.status == 401) this._storage.setItem('expiredToken', 'true');
      else if (_error.status == 404) this._storage.setItem('userDoesNotExist', 'true');

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
