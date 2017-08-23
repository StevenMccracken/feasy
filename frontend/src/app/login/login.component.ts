import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
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
  error: boolean;
  errorMessage: string;
  googleSignInImageSource: string;

  private googleSignInImageSourceDefault = '../../assets/btn_google_signin_light_normal_web@2x.png';
  private googleSignInImageSourceHovered = '../../assets/btn_google_signin_light_focus_web@2x.png';
  private googleSignInImageSourcePressed = '../../assets/btn_google_signin_light_pressed_web@2x.png';
  private standardErrorMessage = 'Something bad happened. Please try signing in again';

  constructor(private _router: Router, private _userService: UserService) {}

  ngOnInit() {
    if (this.isValidStorageItem('currentUser') && this.isValidStorageItem('token')) {
      console.log('Got %s from browser local storage', localStorage.getItem('currentUser'));
      this._router.navigate(['main']);
    } else if (
      this.isValidStorageItem('expiredToken') &&
      localStorage.getItem('expiredToken') === 'true'
    ) {
      // Remove the expiredToken local storage item now
      localStorage.removeItem('expiredToken');

      // Update the login screen error
      this.error = true;
      this.errorMessage = 'Please sign in again to continue';
      this.googleSignInImageSource = this.googleSignInImageSourceDefault;
    } else {
      this.error = false;
      this.errorMessage = '';
      this.googleSignInImageSource = this.googleSignInImageSourceDefault;

    }
  }

  googleSignInHover() {
    this.googleSignInImageSource = this.googleSignInImageSourceHovered;
  }

  googleSignInUnhover() {
    this.googleSignInImageSource = this.googleSignInImageSourceDefault;
  }

  /**
   * Presents a popup window to authenticate offline access via
   * Google. Then waits for the corresponding login info from the
   * API. Updates the local storage with authentication information.
   * Routes the user to the main page once the login is successful
   */
  googleSignIn() {
    // Update the Google sign-in button styling
    this.googleSignInImageSource = this.googleSignInImageSourcePressed;

    // Reset any previous error message
    if (this.errorMessage !== undefined && this.errorMessage !== '') {
      this.error = false;
      this.errorMessage = '';
    }

    // Get the Google OAuth2.0 authentication URL for Feasy
    this._userService.getAuthorizationUrl()
      .then((authUrl: string) => {
        // Update the Google sign-in button styling
        this.googleSignInImageSource = this.googleSignInImageSourceDefault;

        // Open the authentication URL in a popup window
        var popup = window.open(authUrl, 'Authenticate Google', 'width=600, height=600');
        if (popup === null) {
          this.error = true;
          this.errorMessage = this.standardErrorMessage;
          console.error('Opening Google OAuth2.0 window returned null');
        } else {
          // Automatically close the popup window after 25 seconds
          setTimeout(() => popup.close(), 25000);

          /**
           * Subscribe to an event for when the user finishes Google
           * authentication in the popup. Popup variable is null inside the
           * user service call closure, so this subscription is necessary
           */
          let googleAuthSource = new BehaviorSubject<boolean>(false); // Default value = false
          let popupWindowStatus = googleAuthSource.asObservable();
          popupWindowStatus.subscribe((finishedGoogleAuth) => {
            if (finishedGoogleAuth) popup.close();
          });

          // Fetch the login credentials for the Google account the user selects
          this._userService.authenticateGoogle()
            .then((loginInfo: Object) => {
              // Signal that Google authentication inside the popup window is done to close it
              googleAuthSource.next(true);

              // Check for the authentication info
              if (loginInfo['token'] !== null && loginInfo['username'] !== null) {
                // Add the token and username data to local storage
                localStorage.setItem('token', loginInfo['token']);
                localStorage.setItem('currentUser', loginInfo['username']);

                // Route the user into the application
                this._router.navigate(['main']);
              } else {
                // Returned token or username was null. Very strange
                this.error = true;
                this.errorMessage = this.standardErrorMessage;
                console.error('Couldn\'t log in user because token or username was null');
              }
            })
            .catch((loginError: Response) => {
              // Signal that Google authentication inside the popup window is done to close it
              googleAuthSource.next(true);
              switch (loginError.status) {
                default:
                  // API error
                  this.error = true;
                  this.errorMessage = this.standardErrorMessage;
                  console.error(loginError);
              }
            });
        }
      })
      .catch((getAuthUrlError: Response) => {
        // Update the Google sign-in button styling
        this.googleSignInImageSource = this.googleSignInImageSourceDefault;

        switch (getAuthUrlError.status) {
          default:
            // API error
            this.error = true;
            this.errorMessage = this.standardErrorMessage;
            console.error(getAuthUrlError);
        }
      });
  }

  /**
   * Calls the login service and updates the local storage with authentication
   * information. Routes the user to the main page once the login is successful
   */
  validate() {
    // Reset any previous error message
    if (this.errorMessage !== undefined && this.errorMessage != '') this.errorMessage = '';

    // Username needs to be saved for closure created with service call to set local storage
    let username = this._username;
    this._userService.validate(this._username, this._password)
      .then((token) => {
        if (token !== null) {
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
      .catch((loginError: Response) => {
        switch (loginError.status) {
          case 401:
            this.error = true;
            this.errorMessage = 'Username or password is incorrect';
            break;
          default:
            // API error
            this.error = true;
            this.errorMessage = this.standardErrorMessage;
            console.error(loginError);
        }
      });
  }

  /**
   * Determines if a specific local storage item contains any meaningful data
   * @param {string} storageItemKey the key of the local storage item
   * @return {boolean} whether or not the key contains a meaningful (non-empty) data value
   */
  isValidStorageItem(storageItemKey: string): boolean {
    let storageItem = localStorage.getItem(storageItemKey);
    return storageItem != null && storageItem != undefined && storageItem != '';
  }
}
