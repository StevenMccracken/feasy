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
  _alphaCode: string;
  _passwordConfirm: string;

  // Variables to update the form to display errors
  error: boolean = false;
  errorMessage: string = '';
  private standardErrorMessage: string = 'Something bad happened. Please try signing up again';

  // An JSON mapping variable names to more formal english words
  private varToWordMap: Object = {
    username: 'username',
    password: 'password',
    email: 'email address',
    firstName: 'first name',
    lastName: 'last name',
    alphaCode: 'access code',
  };

  constructor(
    private ROUTER: Router,
    private ERROR: ErrorService,
    private USER_SERVICE: UserService,
    private UTILS: CommonUtilsService,
    private STORAGE: LocalStorageService,
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

    /*
     * If the user object has a value, send it's
     * information to create a user through the API
     */
    if (this.UTILS.hasValue(this.user)) {
      // Send the user data to the API to create the user
      this.USER_SERVICE.create(this.user, this._alphaCode)
        .then((token: string) => {
          // Add token and username info to browser local storage
          this.STORAGE.setItem('token', token);
          this.STORAGE.setItem('currentUser', this.user.username);

          // Route the user into the app
          this.ROUTER.navigate(['/main']);
        }) // End then(token)
        .catch((createUserError: Error) => {
          this.error = true;
          let unknownError: boolean = false;

          if (this.ERROR.isLocalError(createUserError)) {
            if (createUserError.getType() === 'null_token') {
              /* tslint:disable max-line-length */
              this.errorMessage = 'Congratulations on creating your account! Unfortunately, there was a problem signing you in. Please go to the login page to sign in. We apologize for this inconvenience';
              /* tslint:enable max-line-length */
            } else unknownError = true;
          } else if (this.ERROR.isRemoteError(createUserError)) {
            if (this.ERROR.isResourceError(createUserError as RemoteError)) {
              // Another user exists with one of these attributes from the form
              const duplicateValue: string = createUserError.getCustomProperty('duplicateParameter');
              const officialName: string = this.varToWordMap[duplicateValue] || duplicateValue;

              if (duplicateValue === 'username' || duplicateValue === 'email') this.errorMessage = `That ${officialName} is already taken`;
              else if (duplicateValue === 'alphaCode') this.errorMessage = `That ${officialName} has already been used`;
              else unknownError = true;
            } else if (this.ERROR.isInvalidRequestError(createUserError as RemoteError)) {
              this.errorMessage = this.handleInvalidRequestError(createUserError as RemoteError);
            } else if (this.ERROR.isResourceDneError(createUserError as RemoteError)) {
              const officialName = this.varToWordMap['alphaCode'] || 'access code';
              this.errorMessage = `That ${officialName} does not exist`;
            } else unknownError = true;
          } else unknownError = true;

          if (unknownError) this.handleUnknownError(createUserError);
        }); // End this.USER_SERVICE.create()
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
    if (invalidParams.length === 0) errorMessage = this.standardErrorMessage;
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
   * Handles unexpected error types by displaying
   * the standard error message and logging the error
   * @param {Error} _error the error of an unknown type
   */
  private handleUnknownError(_error: Error): void {
    this.error = true;
    this.errorMessage = this.standardErrorMessage;
    console.error(_error);
  } // End handleUnknownError()
}
