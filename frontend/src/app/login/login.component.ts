import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserService } from '../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  _username: string;
  _password: string;
  form: FormGroup;
  error = false;
  errorMessage: string;
  private standardErrorMessage = 'Something bad happened. Please try signing in again';

  constructor(private _userService: UserService, private _router: Router) {}

  ngOnInit() {
    if (this.isValidStorageItem('currentUser') && this.isValidStorageItem('token')) {
      console.log('Got %s from browser local storage', localStorage.getItem('currentUser'));
      this._router.navigate(['main']);
    }
  }

  validate() {
    // Reset any previous error message
    if (this.errorMessage != undefined && this.errorMessage != '') this.errorMessage = '';

    // Username needs to be saved for closure created with service call to set local storage
    let username = this._username;
    this._userService.validate(this._username, this._password)
      .then((token) => {
        if (token != null) {
          // Add the token and username data to local storage
          localStorage.setItem('token', token);
          localStorage.setItem('currentUser', username);

          // Route the user into the application
          this._router.navigate(['main']);
        } else {
          // Returned token was null. Very strange
          this.error = true;
          this.errorMessage = this.standardErrorMessage;
          console.error('Couldn\'t log in user because token was null');
        }
      })
      .catch((loginError) => {
        if (loginError.status == 401) {
          this.error = true;
          this.errorMessage = 'Username or password is incorrect';
        } else {
          // API error
          this.error = true;
          this.errorMessage = this.standardErrorMessage;
          console.error(loginError);
        }
      });
  }

  isValidStorageItem(storageItemKey: string): boolean {
    let storageItem = localStorage.getItem(storageItemKey);
    return storageItem != null && storageItem != undefined && storageItem != '';
  }
}
