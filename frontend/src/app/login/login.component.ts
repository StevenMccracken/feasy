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

// Import 3rd party libraries
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// Import our files
import { UserService } from '../services/user.service';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  _username: string;
  _password: string;
  alphaCode: string;
  form: FormGroup;
  error: boolean;
  errorMessage: string;
  googleSignInImageSource: string;

  private googleSignInImageSourceDefault: string = '../../assets/btn_google_signin_light_normal_web@2x.png';
  private googleSignInImageSourceHovered: string = '../../assets/btn_google_signin_light_focus_web@2x.png';
  private googleSignInImageSourcePressed: string = '../../assets/btn_google_signin_light_pressed_web@2x.png';
  private standardErrorMessage: string = 'Something bad happened. Please try signing in again';

  constructor(
    private _router: Router,
    private _userService: UserService,
    private _utils: CommonUtilsService,
    private _storage: LocalStorageService,
  ) {}

  ngOnInit(): void {
    // Check if there is a currentUser and token in local storage
    if (this._storage.isValidItem('currentUser') && this._storage.isValidItem('token')) {
      // Both items exists, so there is no need to have the user enter their username/password
      console.log('Got %s from browser local storage', this._storage.getItem('currentUser'));

      // Try and refresh the auth token. Regardless of the result, route the user to the main page
      this._userService.refreshAuthToken()
        .then((token: string) => {
          if (this._utils.hasValue(token)) this._storage.setItem('token', token);
          else console.error('Token was empty while trying to refresh token');

          this._router.navigate(['main']);
        })
        .catch((refreshTokenError: Response) => {
          console.error('Service request to refresh token failed');
          console.error(refreshTokenError);

          this._router.navigate(['main']);
        });

    } else if (
      this._storage.isValidItem('expiredToken') &&
      this._storage.getItem('expiredToken') === 'true'
    ) {
      /*
       * Somewhere else in the app updated this storage item to indicate
       * that the user currently logged in has an expired token. Remove their
       * current token and prompt them to enter their username and password
       */
      this._storage.deleteItem('expiredToken');

      // Update the login screen error
      this.error = true;
      this.errorMessage = 'Please sign in again to continue';
      this.googleSignInImageSource = this.googleSignInImageSourceDefault;
    } else {
      // There is no token in storage currently, so don't display errors. Just display the main login form
      this.error = false;
      this.errorMessage = '';
      this.googleSignInImageSource = this.googleSignInImageSourceDefault;
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

    // Reset any previous error message
    if (this.error) {
      this.error = false;
      this.errorMessage = '';
    }

    // Get the Google OAuth2.0 authentication URL for Feasy
    this._userService.getAuthorizationUrl()
      .then((authUrl: string) => {
        // Update the Google sign-in button styling
        this.googleSignInImageSource = this.googleSignInImageSourceDefault;

        // Open the authentication URL in a popup window
        const popup = window.open(authUrl, 'Authenticate Google', 'width=600, height=600');
        if (!this._utils.hasValue(popup)) {
          this.error = true;
          this.errorMessage = this.standardErrorMessage;
          console.error('Opening Google OAuth2.0 window returned null');
        } else {
          // Automatically close the popup window after 1 minute
          setTimeout(() => popup.close(), 60000);

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
          this._userService.authenticateGoogle(this.alphaCode)
            .then((loginInfo: Object) => {
              // Signal that Google authentication inside the popup window is done to close it
              googleAuthSource.next(true);

              // Check for the authentication info
              if (this._utils.hasValue(loginInfo['token'])) {
                // Add the token and username data to local storage
                this._storage.setItem('token', loginInfo['token']);
                this._storage.setItem('currentUser', loginInfo['username']);

                // Route the user into the application
                this._router.navigate(['main']);
              } else {
                // Returned token or username was null. Very strange
                this.error = true;
                this.errorMessage = this.standardErrorMessage;
                console.error('Couldn\'t log in user because token or username was null');
              }
            }) // End then(loginInfo)
            .catch((loginError: Response) => {
              // Signal that Google authentication inside the popup window is done to close it
              googleAuthSource.next(true);

              this.error = true;
              switch (loginError.status) {
                case 400:
                  this.errorMessage = 'You need an access code to sign in with that Google account';
                  break;
                case 403:
                  this.errorMessage = 'That access code has already been used';
                  break;
                case 404:
                  this.errorMessage = 'That access code is invalid';
                  break;
                default:
                  // API error
                  this.errorMessage = this.standardErrorMessage;
                  console.error(loginError);
              }
            }); // End this._userService.authenticateGoogle()
        }
      }) // End then(authUrl)
      .catch((getAuthUrlError: Response) => {
        // Update the Google sign-in button styling
        this.googleSignInImageSource = this.googleSignInImageSourceDefault;

        this.error = true;
        switch (getAuthUrlError.status) {
          default:
            this.errorMessage = this.standardErrorMessage;
            console.error(getAuthUrlError);
        }
      }); // End this._userService.getAuthorizationUrl()
  } // End googleSignIn()

  /**
   * Calls the login service and updates the local storage with authentication
   * information. Routes the user to the main page if the login is successful
   */
  signIn(): void {
    // Reset any previous error message
    if (this.error) {
      this.error = false;
      this.errorMessage = '';
    }

    // Checks the values from the form because that form validation can fail sometimes
    const usernameEntered: Boolean = this._utils.hasValue(this._username);
    const passwordEntered: Boolean = this._utils.hasValue(this._password);
    this.error = !usernameEntered || !passwordEntered;

    // If the form validation failed and invalid username/password were passed to the component, display an error
    if (this.error) {
      this.errorMessage = 'Please enter your ';
      if (!usernameEntered) this.errorMessage += 'username';
      if (!passwordEntered) {
        if (!usernameEntered) this.errorMessage += ' and password';
        else this.errorMessage += 'password';
      }

      if (this.errorMessage === 'Please enter your ') this.errorMessage += 'login credentials';
    } else {
      // Username needs to be saved for closure created with service call to set local storage
      const username = this._username;
      this._userService.validate(this._username, this._password)
        .then((token) => {
          if (this._utils.hasValue(token)) {
            // Add the token and username data to local storage
            this._storage.setItem('token', token);
            this._storage.setItem('currentUser', username);

            // Route the user into the application
            this._router.navigate(['main']);
          } else {
            // Returned token was null. Very strange
            this.error = true;
            this.errorMessage = this.standardErrorMessage;
            console.error('Couldn\'t log in user because token was null');
          }
        }) // End then(token)
        .catch((loginError: Response) => {
          this.error = true;
          switch (loginError.status) {
            case 401:
              this.errorMessage = 'Username or password is incorrect';
              break;
            default:
              // API error
              this.errorMessage = this.standardErrorMessage;
              console.error(loginError);
          }
        }); // End this._userService.validate()
    }
  } // End signIn()
}
