// Import angular packages
import {
  OnInit,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup } from '@angular/forms';

// Import 3rd-party libraries
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// Import our files
import { Error } from '../objects/error';
import { LocalError } from '../objects/local-error';
import { RemoteError } from '../objects/remote-error';
import { UserService } from '../services/user.service';
import { ErrorService } from '../services/error.service';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  // Variables from the login form
  _username: string;
  _password: string;
  _alphaCode: string;
  form: FormGroup;

  // Variables to update the form to display errors
  error: boolean;
  errorMessage: string;

  /* tslint:disable max-line-length */
  private errorMessages: Object = {
    signInAgain: 'Please sign in again to continue.',
    invalidCredentials: 'Your username or password is incorrect.',
    general: 'Something bad happened. Please try signing in again.',
    googleAuthPopup: 'Please enable popups in your browser settings in order to sign in with Google.',
    regularSignInWithGoogle: 'You signed up using your Google account and must sign in by clicking the \'Sign in with Google\' button',
    googleAuthHalfSuccess: 'Your Google Authentication worked, but we were unable to sign you in right now. Please try again later.',
    signInHalfSuccess: 'Your username and password were correct, but there was a problem signing you in. Please try again later, or contact us at feasyresponse@gmail.com.',
  };
  /* tslint:enable max-line-length */

  private times: Object = {
    popupTimeout: 60000,
    displayMessage: 5000,
  };

  // An JSON mapping variable names to more formal english words
  private varToWordMap: Object = {
    username: 'username',
    password: 'password',
    email: 'email address',
    alphaCode: 'access code',
  };

  // Image URLs for the Google sign-in button (depending on it's state)
  googleSignInImageSource: string;
  private googleSignInImageSourceDefault: string = '../../assets/buttons/btn_google_signin_light_normal_web@2x.png';
  private googleSignInImageSourceHovered: string = '../../assets/buttons/btn_google_signin_light_focus_web@2x.png';
  private googleSignInImageSourcePressed: string = '../../assets/buttons/btn_google_signin_light_pressed_web@2x.png';

  constructor(
    private ROUTER: Router,
    private USERS: UserService,
    private ERROR: ErrorService,
    private UTILS: CommonUtilsService,
    private STORAGE: LocalStorageService,
  ) {}

  ngOnInit(): void {
    // Check if there is a currentUser and token in local storage
    if (this.STORAGE.isValidItem('currentUser') && this.STORAGE.isValidItem('token')) {
      this.USERS.startTokenAutoRefresh();
      this.ROUTER.navigate(['main']);
    } else {
      if (this.STORAGE.isValidItem('expiredToken') && this.STORAGE.getItem('expiredToken') === 'true') {
        /*
         * Somewhere else in the app updated this storage item to indicate
         * that the user currently logged in has an expired token. Remove
         * their current token and prompt them to enter their username
         * and password. TODO: Use the messaging service for this
         */
        this.STORAGE.deleteItem('expiredToken');

        // Update the login screen error
        this.displayError(this.errorMessages['signInAgain']);
        this.googleSignInImageSource = this.googleSignInImageSourceDefault;
      } else {
        // There is no token in storage currently, so don't display errors. Just display the main login form
        this.resetError();
        this.googleSignInImageSource = this.googleSignInImageSourceDefault;
      }

      this.USERS.stopTokenAutoRefresh();
    }
  } // End ngOnInit()

  /**
   * Updates the Google sign-in button image source to the hovered image
   */
  googleSignInHover(): void {
    this.googleSignInImageSource = this.googleSignInImageSourceHovered;
  } // End googleSignInHover()

  /**
   * Updates the Google sign-in button image source to the unhovered image
   */
  googleSignInUnhover(): void {
    this.googleSignInImageSource = this.googleSignInImageSourceDefault;
  } // End googleSignInUnhover()

  /**
   * Presents a popup window to authenticate offline access via
   * Google. Then waits for the corresponding login info from the
   * API. Updates the local storage with authentication information.
   * Routes the user to the main page once the login is successful
   */
  googleSignIn(): void {
    // Update the Google sign-in button styling
    this.googleSignInImageSource = this.googleSignInImageSourcePressed;

    this.resetError();

    // Get the Google OAuth2.0 authentication URL for Feasy
    this.USERS.getAuthorizationUrl()
      .then((authUrl: string) => {
        // Update the Google sign-in button styling
        this.googleSignInImageSource = this.googleSignInImageSourceDefault;

        // Open the authentication URL in a popup window
        const popup = window.open(authUrl, 'Authenticate Google', 'width=600, height=600');
        if (!this.UTILS.hasValue(popup)) this.displayError(this.errorMessages['googleAuthPopup']);
        else {
          // Automatically close the popup window after 1 minute
          setTimeout(() => popup.close(), this.times['popupTimeout']);

          /**
           * Subscribe to an event for when the user finishes Google
           * authentication in the popup. Popup variable is null inside the
           * user service call closure, so this subscription is necessary
           */
          const googleAuthSource = new BehaviorSubject<boolean>(false); // Default value = false
          const popupWindowStatus = googleAuthSource.asObservable();
          popupWindowStatus.subscribe((finishedGoogleAuth) => {
            if (finishedGoogleAuth) popup.close();
          });

          // Fetch the login credentials for the Google account the user selects
          this.USERS.authenticateGoogle(this._alphaCode)
            .then((loginInfo: Object) => {
              // Signal that Google authentication inside the popup window is done to close it
              googleAuthSource.next(true);
              if (this.UTILS.hasValue(loginInfo)) {
                // Add the token and username data to local storage
                this.STORAGE.setItem('token', loginInfo['token']);
                this.STORAGE.setItem('currentUser', loginInfo['username']);

                this.USERS.startTokenAutoRefresh();

                // Route the user into the application
                this.ROUTER.navigate(['main']);
              } else {
                const error: LocalError = new LocalError();
                error.setCustomProperty('emptyResponse', 'The response was empty but did not throw an error');
                Promise.reject(error);
              }
            }) // End then(loginInfo)
            .catch((loginError: Error) => {
              // Signal that Google authentication inside the popup window is done to close it
              googleAuthSource.next(true);

              // this.error = true;
              let errorMessage: string;
              let unknownError: boolean = false;

              if (this.ERROR.isLocalError(loginError)) {
                if (loginError.getType() === 'null_authInfo') {
                  // The service call succeeded, but the necessary login info was missing
                  errorMessage = this.errorMessages['googleAuthHalfSuccess'];
                  console.error(loginError);
                } else unknownError = true;
              } else if (this.ERROR.isRemoteError(loginError)) {
                if (this.ERROR.isInvalidRequestError(loginError)) {
                  // Likely, the alpha code was not in a valid form
                  errorMessage = this.handleInvalidRequestError(loginError as RemoteError);
                } else if (this.ERROR.isResourceError(loginError as RemoteError)) {
                  // One of the attributes of the Google account was already being used by another account
                  const invalidResource: string = loginError.getCustomProperty('invalidResource') || '';
                  const officialName: string = this.varToWordMap[invalidResource] || '';

                  if (invalidResource === 'username' || invalidResource === 'email') errorMessage = `That ${officialName} is already taken`;
                  else if (invalidResource === 'alphaCode') errorMessage = `That ${officialName} has already been used`;
                  else unknownError = true;
                } else if (this.ERROR.isResourceDneError(loginError as RemoteError)) {
                  // The access code does not exist
                  const officialName: string = this.varToWordMap['alphaCode'];
                  errorMessage = `That ${officialName} does not exist`;
                } else unknownError = true;
              } else unknownError = true;

              if (unknownError) this.handleUnknownError(loginError);
              else this.displayError(errorMessage);
            }); // End this.USERS.authenticateGoogle()
        }
      }) // End then(authUrl)
      .catch((getAuthUrlError: Error) => {
        // Update the Google sign-in button styling
        this.googleSignInImageSource = this.googleSignInImageSourceDefault;
        this.handleUnknownError(getAuthUrlError);
      }); // End this.USERS.getAuthorizationUrl()
  } // End googleSignIn()

  /**
   * Calls the login service and updates the local storage with authentication
   * information. Routes the user to the main page if the login is successful
   */
  signIn(): void {
    this.resetError();

    // Checks the values from the form because that form validation can fail sometimes
    const usernameEntered: boolean = this.UTILS.hasValue(this._username);
    const passwordEntered: boolean = this.UTILS.hasValue(this._password);
    const errorOccurred: boolean = !usernameEntered || !passwordEntered;

    // If the form validation failed and invalid username/password were passed to the component, display an error
    if (errorOccurred) {
      let errorMessage: string = 'Please enter your ';
      if (!usernameEntered) errorMessage = `${errorMessage} username`;
      if (!passwordEntered) {
        if (!usernameEntered) errorMessage = `${errorMessage} and password`;
        else errorMessage = `${errorMessage} password`;
      }

      // If there is still an error but the username & password were entered, provide a generic message
      if (usernameEntered && passwordEntered) errorMessage = `${errorMessage} login credentials`;

      this.displayError(errorMessage);
    } else {
      // Username needs to be saved for closure created with service call to set local storage
      const username: string = this._username;
      this.USERS.getAuthToken(this._username, this._password)
        .then((token: string) => {
          // Add the token and username data to local storage
          this.STORAGE.setItem('token', token);
          this.STORAGE.setItem('currentUser', username);

          this.USERS.startTokenAutoRefresh();

          // Route the user into the application
          this.ROUTER.navigate(['main']);
        }) // End then(token)
        .catch((loginError: Error) => {
          let errorMessage: string;
          let unknownError: boolean = false;

          if (this.ERROR.isLocalError(loginError)) {
            if (loginError.getType() === 'null_token') errorMessage = this.errorMessages['signInHalfSuccess'];
            else unknownError = true;
          } else if (this.ERROR.isRemoteError(loginError)) {
            if (this.ERROR.isInvalidRequestError(loginError)) errorMessage = this.handleInvalidRequestError(loginError as RemoteError);
            else if (this.ERROR.isResourceError(loginError as RemoteError)) errorMessage = this.errorMessages['regularSignInWithGoogle'];
            else if (this.ERROR.isLoginError(loginError as RemoteError)) errorMessage = this.errorMessages['invalidCredentials'];
            else unknownError = true;
          } else unknownError = true;

          if (unknownError) this.handleUnknownError(loginError);
          else this.displayError(errorMessage);
        }); // End this.USERS.getAuthToken()
    }
  } // End signIn()

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
   * Displays an error message for a given duration
   * @param {string} _message the message to display. If
   * no value is given, the default value will be used
   * @param {number} _duration the duration for the message to
   * last. If no value is given, the default value will be used
   */
  displayError(_message?: string, _duration?: number): void {
    const message: string = this.UTILS.hasValue(_message) ? _message : this.errorMessages['general'];
    const duration: number = this.UTILS.hasValue(_duration) ? _duration : this.times['displayMessage'];

    this.error = true;
    this.errorMessage = message;

    const self = this;
    setTimeout(() => self.resetError(), duration);
  } // End displayError()

  /**
   * Resets any error message that is currently displayed
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
