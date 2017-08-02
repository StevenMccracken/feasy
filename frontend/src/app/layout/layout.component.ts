import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { Account } from '../objects/user';
import { UserService } from '../services/user.service';

declare var $: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  user = new Account();
  firstName: string;

  constructor(private _router: Router, private _userService: UserService) {}

  ngOnInit() {
    $("#button-slide").sideNav();

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
}
