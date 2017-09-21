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
  // TODO: Do we need all of these class variables?
  user: User = new User();
  alphaCode: string;
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
    alphaCode: 'access code',
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
        // Add token and username info to browser local storage
        this._storage.setItem('token', token);
        this._storage.setItem('currentUser', this.user.username);

        // Route the user into the app
        this._router.navigate(['/main']);
      }) // End then(token)
      .catch((createUserError: Error) => {
        this.error = true;
        let unknownError = false;

        if (this._error.isLocalError(createUserError)) {
          if (createUserError.getType() === 'null_token') {
            /* tslint:disable max-line-length */
            this.errorMessage = 'Congratulations on creating your account! Unfortunately, there was a problem signing you in. Please go to the login page to sign in. We apologize for this inconvenience';
            /* tslint:enable max-line-length */
          } else unknownError = true;
        } else if (this._error.isRemoteError(createUserError)) {
          if (this._error.isResourceError(createUserError as RemoteError)) {
            // Another user exists with one of these attributes from the form
            const duplicateValue = createUserError.getCustomProperty('duplicateParameter');
            const officialName = this.varToWordMap[duplicateValue] || duplicateValue;
            if (duplicateValue === 'username' || duplicateValue === 'email') {
              this.errorMessage = `That ${officialName} is already taken`;
            } else if (duplicateValue === 'alphaCode') {
              this.errorMessage = `That ${officialName} has already been used`;
            } else unknownError = true;
          } else if (this._error.isInvalidRequestError(createUserError as RemoteError)) {
            this.errorMessage = this.handleInvalidRequestError(createUserError as RemoteError);
          } else if (this._error.isResourceDneError(createUserError as RemoteError)) {
            const officialName = this.varToWordMap['alphaCode'] || 'access code';
            this.errorMessage = `That ${officialName} is not valid`;
          } else unknownError = true;
        } else unknownError = true;

        if (unknownError) this.handleUnknownError(createUserError);
      }); // End this._userService.create()
  } // End signup()

  /**
   * Determines the error message to display for an invalid request error after trying to submit the signup form
   * @param {RemoteError} [_error =  = new RemoteError()] the error of type invalid_request_error
   * @return {string} the appropriate error message for the incorrect fields in the form
   */
  private handleInvalidRequestError(_error: RemoteError = new RemoteError()): string {
    let errorMessage;
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
   * Handles unexpected error types by displaying the standard error message and logging the error
   * @param {Error} _error the error of an unknown type
   */
  private handleUnknownError(_error: Error): void {
    this.error = true;
    this.errorMessage = this.standardErrorMessage;
    console.error(_error);
  } // End handleUnknownError()
}
