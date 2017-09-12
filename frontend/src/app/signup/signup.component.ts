// Import angular packages
import {
  OnInit,
  Component,
} from '@angular/core';
import {
  FormGroup,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Router } from '@angular/router';

// Import our files
import { User } from '../objects/user';
import { UserService } from '../services/user.service';
import { ErrorService } from '../services/error.service';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  // TODO: Do we need all of these class variables?
  user: User = new User();
  alphaCode: string = '';
  passwordValidator: string;
  error: boolean = false;
  errorMessage: string = '';
  private standardErrorMessage: string = 'Something bad happened. Please try signing up again';
  private varToWordMap: Object = {
    username: 'username',
    password: 'password',
    email: 'email address',
    firstName: 'first name',
    lastName: 'last name',
  };

  constructor(
    private _router: Router,
    private _error: ErrorService,
    private _userService: UserService,
    private _utils: CommonUtilsService,
    private _storage: LocalStorageService,
  ) {}

  /**
   * Calls the user service to create a new user through the API.
   * Updates the local storage with the corresponding authentication
   * credentials. Routes the user to the main page on successful sign-up
   */
  signup(): void {
    if (this.error) {
      this.error = false;
      this.errorMessage = '';
    }

    if (!this.user) return;

    // Send the user data to the API to create the user
    this._userService.create(this.user, this.alphaCode)
      .then((token: string) => {
        if (this._utils.hasValue(token)) {
          // Add token and username info to browser local storage
          this._storage.setItem('token', token);
          this._storage.setItem('currentUser', this.user.username);

          // Route the user into the app
          this._router.navigate(['/main']);
        } else {
          // User service did not return a token for some reason
          this.error = true;
          this.errorMessage = this.standardErrorMessage;
          console.error('Failed to create new user because token is null/undefined');
        }
      }) // End then(token)
      .catch((createUserError: any) => {
        this.error = true;

        // Update the HTML to display an error message
        if (typeof createUserError === 'string') {
          // Another user exists with one of these attributes from the form
          if (createUserError === 'username' || createUserError === 'email') {
            this.errorMessage = `That ${this.varToWordMap[createUserError]} is already taken`;
          } else if (createUserError === 'alpha') {
            this.errorMessage = 'That access code has already been used';
          } else {
            // Unknown error message content for the login error
            this.errorMessage = this.standardErrorMessage;
            console.error(createUserError);
          }
        } else if (Array.isArray(createUserError)) {
          // The values from the form were not in the correct format
          this.errorMessage = 'Invalid fields: ';
          if (createUserError.length === 1) {
            this.errorMessage += this.varToWordMap[createUserError[0]];
          } else if (createUserError.length === 2) {
            this.errorMessage += `${this.varToWordMap[createUserError[0]]} and ${this.varToWordMap[createUserError[1]]}`;
          } else {
            for (let i = 0; i < createUserError.length - 1; i++) {
              this.errorMessage += `${this.varToWordMap[createUserError[i]]}, `;
            }

            this.errorMessage += `and ${this.varToWordMap[createUserError[createUserError.length - 1]]}`;
          }
        } else if (this._error.isResourceDneError(createUserError)) {
          this.errorMessage = 'That access code is invalid';
        } else {
          // An unexpected error occurred (other than bad request or resource error)
          this.errorMessage = this.standardErrorMessage;
          console.error(createUserError);
        }
      }); // End this._userService.create()
  } // End signup()
}
