// Import Angular packages
import {
  OnInit,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';

// Import our files
import { Error } from '../objects/error';
import { RemoteError } from '../objects/remote-error';
import { UserService } from '../services/user.service';
import { ErrorService } from '../services/error.service';
import { CommonUtilsService } from '../utils/common-utils.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css'],
})
export class PasswordResetComponent implements OnInit {
  _emailAddress: string;
  userId: string;
  escapedResetCode: string;
  displayName: string;

  _newPassword: string;
  _newPasswordConfirm: string;

  showInitialResetForm: boolean;
  showEmailSentMessage: boolean;
  showFinalResetForm: boolean;
  showSuccess: boolean;

  initialPasswordResetError: boolean;
  initialPasswordResetErrorMessage: string;

  passwordResetDetailsError: boolean;
  passwordResetDetailsErrorMessage: string;

  finalResetError: boolean;
  finalResetErrorMessage: string;

  private times: Object = {
    formResetDuration: 5000,
    routeToLoginDelay: 5000,
  };

  /* tslint:disable max-line-length */
  defaultErrorMessage: string = 'We apologize, but we are unable to help you reset your password right now. Please email us at feasyresponse@gmail.com to resolve this issue';
  /* tslint:enable max-line-length */

  constructor(
    private ROUTER: Router,
    private USERS: UserService,
    private ERROR: ErrorService,
    private UTILS: CommonUtilsService,
  ) {}

  ngOnInit() {
    const passwordResetCode = this.parseUrlForResetCode(this.ROUTER.url);
    if (this.UTILS.hasValue(passwordResetCode)) {
      this.escapedResetCode = decodeURIComponent(passwordResetCode);
      this.getPasswordResetDetails(this.escapedResetCode)
        .then((userDetails: Object) => {
          this.userId = userDetails['userId'];

          let nameMessage: string;
          if (this.UTILS.hasValue(userDetails['firstName']) && userDetails['firstName'] !== '') {
            nameMessage = `, ${userDetails['firstName']}`;
          } else if (this.UTILS.hasValue(userDetails['username']) && userDetails['username'] !== '') {
            nameMessage = `, ${userDetails['username']}`;
          } else nameMessage = '';

          this.displayName = nameMessage;
          this.showFinalResetForm = true;
        }) // End then(userId)
        .catch((errorMessage: Error) => {
          this.passwordResetDetailsError = true;

          if (typeof errorMessage !== 'string') {
            this.passwordResetDetailsErrorMessage = this.defaultErrorMessage;
            console.error(errorMessage);
          } else this.passwordResetDetailsErrorMessage = errorMessage;

          this.passwordResetDetailsErrorMessage += '. You will be redirected to send another reset email shortly'

          // Display the initial reset form after a short delay
          const self = this;
          setTimeout(
            () => {
              self.passwordResetDetailsError = false;
              self.passwordResetDetailsErrorMessage = '';
              self.showInitialResetForm = true;
            },
            this.times['formResetDuration']);
        }); // End this.getPasswordResetDetails()
    } else this.showInitialResetForm = true;
  } // End ngOnInit()

  /**
   * Parses a given URL string for a password reset code
   * @param {string} [_url = ''] the URL string
   * @return {string} the password reset code in the URL string
   */
  parseUrlForResetCode(_url: string = ''): string {
    let resetCode;

    const urlParts: String[] = _url.split('?');
    const queryString: String = urlParts.length > 1 ? urlParts[1] : '';
    const queries: String[] = queryString.split('&');

    // Search for the query with 'code=xyz'
    let foundResetCode: boolean = false;
    for (let i = 0; i < queries.length && !foundResetCode; i++) {
      const query: String = queries[i] || '';
      const queryParts: String[] = query.split('code=');
      const potentialResetCode: String = queryParts.length > 1 ? queryParts[1] : '';

      if (potentialResetCode.length > 0) {
        foundResetCode = true;
        resetCode = potentialResetCode;
      }
    }

    return resetCode;
  }

  /**
   * Sends a request to the API to send a password reset
   * email to the email the user entered in the form
   */
  sendResetEmail(): void {
    const promise = this.USERS.sendPasswordResetEmail(this._emailAddress)
      .then(() => {
        this.showInitialResetForm = false;
        this.showEmailSentMessage = true;
      }) // End then()
      .catch((sendEmailError: RemoteError) => {
        this.initialPasswordResetError = true;
        if (this.ERROR.isInvalidRequestError(sendEmailError)) {
          this.initialPasswordResetErrorMessage = 'That email address is invalid';
        } else if (this.ERROR.isResourceDneError(sendEmailError)) {
          this.initialPasswordResetErrorMessage = 'That email address does not exist';
        } else this.initialPasswordResetErrorMessage = this.defaultErrorMessage
      }); // End this.USERS.sendPasswordResetEmail()
  } // End sendResetEmail()

  /**
   * Retrieves user details for a given password reset
   * code in order to later update the user's password
   * @param {string} [_code = ''] the password reset code
   * @return {Promise<Object>} JSON of the user details like
   * userId and username, and possibly first name & last name
   */
  getPasswordResetDetails(_code: string = ''): Promise<Object> {
    const promise = this.USERS.getPasswordResetDetails(_code)
      .then((userDetails: Object) => Promise.resolve(userDetails)) // End then(userDetails)
      .catch((getDetailsError: Error) => {
        let errorMessage: string;
        let unknownError: boolean = false;

        if (this.ERROR.isRemoteError(getDetailsError as RemoteError)) {
          const remoteError: RemoteError = getDetailsError as RemoteError;
          const firstPart: string = 'The password reset code in the URL';

          if (this.ERROR.isInvalidRequestError(remoteError)) errorMessage = `${firstPart} is invalid`;
          else if (this.ERROR.isResourceDneError(remoteError)) errorMessage = `${firstPart} does not exist`;
          else if (this.ERROR.isResourceError(remoteError)) {
            const invalidResourceReason: string = remoteError.getCustomProperty('invalidResourceReason') || '';

            if (invalidResourceReason === 'expired') errorMessage = `${firstPart} has expired`;
            else if (invalidResourceReason === 'used') errorMessage = `${firstPart} has already been used`;
            else unknownError = true;
          } else unknownError = true;
        } else unknownError = true;

        if (unknownError) return Promise.reject(getDetailsError);
        else return Promise.reject(errorMessage);
      }); // End this.USERS.getPasswordResetDetails()

    return promise;
  } // End getPasswordResetDetails()

  /**
   * Sends a request to the API with password entered in the HTML form,
   * the user ID, and the password reset code to reset the user's password
   */
  resetPassword(): void {
    const promise = this.USERS.resetPassword(this.escapedResetCode, this.userId, this._newPassword)
      .then(() => {
        // Show the success info and route back to the login screen after a delay
        this.showFinalResetForm = false;
        this.showSuccess = true;
        const self = this;
        setTimeout(() => self.ROUTER.navigate(['/login']), this.times['routeToLoginDelay']);
      }) // End then()
      .catch((resetPasswordError: RemoteError) => {
        this.finalResetError = true;

        let errorMessage: string;
        let unknownError: boolean = false;
        const firstPart: string = 'The password reset code in the URL';

        if (this.ERROR.isInvalidRequestError(resetPasswordError)) {
          // Get the invalid params
          const invalidParams: string[] = resetPasswordError.getCustomProperty('invalidParameters') || [];

          let invalidUserId: boolean = false;
          let invalidPassword: boolean = false;
          let invalidResetCode: boolean = false;

          // Check for each invalid parameter existence in the invalidParams array
          invalidParams.forEach((invalidParam) => {
            if (invalidParam === 'newPassword') invalidPassword = true;
            else if (invalidParam === 'userId') invalidUserId = true;
            else if (invalidParam === 'resetCode') invalidResetCode = true;
            else console.error('Invalid parameter while resetting password: %s', invalidParam);
          });

          /*
           * If the new password is invalid but something else
           * isn't, log it but display default error to the user
           */
          if (invalidPassword) errorMessage = 'Your new password is invalid. Please try again';
          if (invalidUserId) console.error('Invalid user ID while resetting password');
          if (invalidResetCode) console.error('Invalid reset code while resetting password');

          // If something besides the new password is invalid, that's weird
          unknownError = !invalidPassword;
        } else if (this.ERROR.isResourceDneError(resetPasswordError)) errorMessage = `${firstPart} does not exist`;
        else if (this.ERROR.isResourceError(resetPasswordError)) {
          const invalidResourceReason: string = resetPasswordError.getCustomProperty('invalidResourceReason') || '';

          if (invalidResourceReason === 'expired') errorMessage = `${firstPart} has expired`;
          else if (invalidResourceReason === 'used') errorMessage = `${firstPart} has already been used`;
          else unknownError = true;
        } else unknownError = true;

        if (unknownError) {
          errorMessage = this.defaultErrorMessage;
          console.error(resetPasswordError);
        }

        this.finalResetErrorMessage = errorMessage;
      }); // End this.USERS.resetPassword()
  } // End resetPassword()
}
