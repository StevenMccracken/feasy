import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { Account } from '../objects/user';
import { Assignment } from '../objects/assignment';
import { UserService } from '../services/user.service';
import { AssignmentService } from '../services/assignment.service';

declare var $: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  user = new Account();
  firstName: string;

  //quicksettings variables
  quickSettingDescription: boolean = true;
  quickSettingLabel: boolean = true;
  quickSettingColors: boolean = false;
  connectionMade: boolean = false;

  constructor(private _router: Router, private _userService: UserService, private _assignmentService: AssignmentService) {}

  ngOnInit() {
    $("#button-slide").sideNav();
    if(localStorage['qsColor'] !== '' || localStorage['qsColor'] !== undefined)
      this.quickSettingColors = (localStorage['qsColor'] === 'true') ? true: false;
    if(localStorage['qsDescription'] !== '' || localStorage['qsDescription'] !== undefined)
      this.quickSettingDescription = (localStorage['qsDescription'] === 'true') ? true: false;
    if(localStorage['qsLabel'] !== '' || localStorage['qsLabel'] !== undefined)
      this.quickSettingLabel = (localStorage['qsLabel'] === 'true') ? true: false;
    let currentUser: string = localStorage.getItem('currentUser');
    this._userService.get(currentUser)
      .then((account: Account) => {
        this.user = account;
        if (
          this.user.firstName !== null &&
          this.user.firstName !== undefined &&
          this.user.firstName !== ''
        ) {
          this.firstName = this.user.firstName.charAt(0).toUpperCase() + this.user.firstName.slice(1);
        } else this.firstName = this.user.username;
      })
      .catch((getError: Response) => {
        if (getError.status == 400 || getError.status == 403) {
          this.firstName = 'User';
          console.error(getError);
        } else if (getError.status == 404) {
          // Username is stale. Clear the user and token local storage
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');

          this._router.navigate(['/login']);
        } else this.handleError(getError);
      });
    this._assignmentService.getAll()
                            .then((assignment: Assignment[]) => {

                              this.connectionMade = true;
                              console.log(this.connectionMade);
                            })
                            .catch((error: any) => {
                              alert(error);
                            });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    $("#button-slide").sideNav('destroy');
    this._router.navigate(['login']);
  }

  closeNav(link: string): void {
    $('#button-slide').sideNav('hide');
    if (link === '/main/calendar') this._router.navigate([link]);
  }

  toggleSettings(type: string): void{
    if(type === 'color')
      setTimeout(() => {localStorage.setItem('qsColor', this.quickSettingColors.toString())}, 300);
    if(type === 'label')
      setTimeout(() => {localStorage.setItem('qsLabel', this.quickSettingLabel.toString())}, 300);
    if(type === 'description')
      setTimeout(() => {localStorage.setItem('qsDescription', this.quickSettingDescription.toString())}, 300);
  }

  //error handlers
  private handleError(error: Response): void {
    if (error.status == 401) {
      // Token is stale. Clear the user and token local storage
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');

      // Add the reason for re-routing to login
      localStorage.setItem('expiredToken', 'true');

      // Route to the login page
      this._router.navigate(['/login']);
    } else {
      // API error, server could be down/crashed
      console.error(error);
    }
  }

  debug(): void{
    console.log(localStorage.getItem('qsDescription'));
  }
}
