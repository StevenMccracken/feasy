// Import angular packages
import { Router } from '@angular/router';
import { Component } from '@angular/core';

// Import our files
import { User } from '../objects/user';
import { Error } from '../objects/error';
import { RemoteError } from '../objects/remote-error';
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
  // Variables from the signup form
  user: User = new User();
  _passwordConfirm: string;

  // Variables to update the form to display errors
  error: boolean = false;
  errorMessage: string = '';

  /* tslint:disable max-line-length */
  private errorMessages: Object = {
    general: 'Something bad happened. Please try signing up again.',
    accountCreationNoToken: 'Congratulations on creating your account! Unfortunately, there was a problem signing you in. Please go to the login page to sign in. We apologize for this inconvenience',
  };
  /* tslint:enable max-line-length */

  private times: Object = {
    displayMessage: 5000,
  };

  // An JSON mapping variable names to more formal english words
  private varToWordMap: Object = {
    username: 'username',
    password: 'password',
    email: 'email address',
    firstName: 'first name',
    lastName: 'last name',
  };

  constructor(
    private ROUTER: Router,
    private USERS: UserService,
    private ERROR: ErrorService,
    private UTILS: CommonUtilsService,
    private STORAGE: LocalStorageService,
  ) {}

  /**
   * Calls the user service to create a new user through the API.
   * Updates the local storage with the corresponding authentication
   * credentials. Routes the user to the main page on successful sign-up
   */
  signup(): void {
    this.resetError();

    // If the user object has a value, send it's information to create a user through the API
    if (this.UTILS.hasValue(this.user)) {
      // Send the user data to the API to create the user
      this.USERS.create(this.user)
        .then((token: string) => {
          // Add token and username info to browser local storage
          this.STORAGE.setItem('token', token);
          this.STORAGE.setItem('currentUser', this.user.username);

          // Route the user into the app
          this.ROUTER.navigate(['/main']);
        }) // End then(token)
        .catch((createUserError: Error) => {
          let errorMessage: string;
          let unknownError: boolean = false;

          if (this.ERROR.isLocalError(createUserError)) {
            if (createUserError.getType() === 'null_token') errorMessage = this.errorMessages['accountCreationNoToken'];
            else unknownError = true;
          } else if (this.ERROR.isRemoteError(createUserError)) {
            if (this.ERROR.isResourceError(createUserError as RemoteError)) {
              // Another user exists with one of these attributes from the form
              const duplicateValue: string = createUserError.getCustomProperty('duplicateParameter');
              const officialName: string = this.varToWordMap[duplicateValue] || duplicateValue;

              if (duplicateValue === 'username' || duplicateValue === 'email') errorMessage = `That ${officialName} is already taken`;
              else unknownError = true;
            } else if (this.ERROR.isInvalidRequestError(createUserError as RemoteError)) {
              errorMessage = this.handleInvalidRequestError(createUserError as RemoteError);
            } else unknownError = true;
          } else unknownError = true;

          if (unknownError) this.handleUnknownError(createUserError);
          else this.displayError(errorMessage);
        }); // End this.USERS.create()
    }
  } // End signup()

  /**
   * Determines the error message to display for an invalid
   * request error after trying to submit the signup form
   * @param {RemoteError} [_error = new RemoteError()]
   * the error of type invalid_request_error
   * @return {string} the appropriate error
   * message for the incorrect fields in the form
   */
  private handleInvalidRequestError(_error: RemoteError = new RemoteError()): string {
    let errorMessage: string;
    const invalidParams: string[] = _error.getCustomProperty('invalidParameters') || [];

    // If there are no invalid parameters in the error object, use the standard error message
    if (invalidParams.length === 0) errorMessage = this.errorMessages['general'];
    else {
      // Create the error message from the invalid params array
      errorMessage = 'Your ';
      if (invalidParams.length === 1) {
        // Just add the single parameter to the string
        const invalidField: string = this.varToWordMap[invalidParams[0]] || invalidParams[0];
        errorMessage += `${invalidField} is invalid`;
      } else if (invalidParams.length === 2) {
        // Separate the two invalid params by 'and'
        const invalidFields: string[] = [this.varToWordMap[invalidParams[0]], this.varToWordMap[invalidParams[1]]];
        errorMessage += `${invalidFields[0] || invalidParams[0]} and ${invalidFields[1] || invalidParams[1]} are invalid`;
      } else {
        // Separate all the invalid params by a comma and space
        const lastIndex: number = invalidParams.length - 1;
        for (let i = 0; i < lastIndex; i++) {
          const invalidField: string = this.varToWordMap[invalidParams[i]] || invalidParams[i];
          errorMessage += `${invalidField}, `;
        }

        // Add the last invalid param with an 'and'
        const lastInvalidField: string = this.varToWordMap[invalidParams[lastIndex]] || invalidParams[lastIndex];
        errorMessage += `and ${lastInvalidField} are invalid`;
      }
    }

    return errorMessage;
  } // End handleInvalidRequestError()

  /**
   * Displays a given error message for a given duration
   * @param {string} _message the message to display. If
   * no value is given, the default value will be used
   * @param {number} _duration the duration of the message to display
   * for. If no value is given, the default value will be used
   */
  displayError(_message?: string, _duration?: number): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : this.errorMessage['general'];
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : this.times['displayMessage'];

    this.error = true;
    this.errorMessage = message;

    const self = this;
    setTimeout(() => self.resetError(), duration);
  } // End displayError()

  /**
   * Resets any displayed error
   */
  resetError(): void {
    this.error = false;
    this.errorMessage = '';
  } // End resetError()

  /**
   * Handles unexpected error types by displaying
   * the standard error message and logging the error
   * @param {Error} _error the error of an unknown type
   */
  private handleUnknownError(_error: Error): void {
    console.error(_error);
    this.displayError(this.errorMessages['general']);
  } // End handleUnknownError()
}
