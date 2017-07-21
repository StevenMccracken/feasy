import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { User } from '../objects/user';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit {
  user = new User();
  passwordValidator: string;
  error = false;
  errorMessage: string;
  private standardErrorMessage = 'Something bad happened. Please try signing up again';
  private varToWordMap: Object = {
    username: 'username',
    password: 'password',
    email: 'email address',
    firstName: 'first name',
    lastName: 'last name',
  };

  constructor(private _userService: UserService, private _router: Router) {}

  ngOnInit() {}

  add(): void {
    if (!this.user) return null;

    this._userService.create(this.user)
      .then((token: string) => {
        if (token != null) {
          // Clear any error messages
          if (this.errorMessage != '') this.errorMessage = '';

          // Add username and token to browser local storage
          localStorage.setItem('currentUser', this.user.username);
          localStorage.setItem('token', token);

          // Route the user into the app
          this._router.navigate(['/main']);
        } else {
          // User service did not return a token for some reason
          this.error = true;
          this.errorMessage = this.standardErrorMessage;
          console.error('Failed to create new user because token is null');
        }
      })
      .catch((createUserError) => {
        this.error = true;

        // Clear any previous error message
        if (this.errorMessage != '') this.errorMessage = '';

        // Update the HTML to display an error message
        if (typeof createUserError === 'string') {
          // Another user exists with one of these attributes from the form
          if (createUserError == 'username') {
            this.errorMessage = `Username '${this.user.username}' is already taken`
          } else if (createUserError == 'email') {
            this.errorMessage = `Email address '${this.user.email}' is already taken`
          } else {
            // Unknown error message content for the login error
            this.errorMessage = this.standardErrorMessage;
            console.error(createUserError);
          }
        } else if (Array.isArray(createUserError)) {
          // The values from the form were not in the correct format
          this.errorMessage = 'Incorrect fields: ';
          if (createUserError.length == 1) {
            this.errorMessage += this.varToWordMap[createUserError[0]];
          } else if (createUserError.length == 2) {
            this.errorMessage += `${this.varToWordMap[createUserError[0]]} and ${this.varToWordMap[createUserError[1]]}`;
          } else {
            for (let i = 0; i < createUserError.length - 1; i++) {
              this.errorMessage += `${this.varToWordMap[createUserError[i]]}, `
            }

            this.errorMessage += `and ${this.varToWordMap[createUserError[createUserError.length - 1]]}`;
          }
        } else {
          // An unexpected error occurred (other than bad request or resource error)
          this.errorMessage = this.standardErrorMessage;
          console.error(createUserError);
        }
      });
  }
}
