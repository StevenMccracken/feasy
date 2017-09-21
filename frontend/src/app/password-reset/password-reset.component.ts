// Import Angular packages
import {
  OnInit,
  Component,
} from '@angular/core';
import { Router } from '@angular/router';

// Import our files
import { UserService } from '../services/user.service';
import { CommonUtilsService } from '../utils/common-utils.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
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

  defaultErrorMessage: string = 'We apologize, but we are unable to help you reset your password right now. Please email us at feasyresponse@gmail.com to resolve this issue';

  constructor(private ROUTER: Router, private UTILS: CommonUtilsService, private USER_SERVICE: UserService) {}

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
        .catch((errorMessage: string) => {
          this.passwordResetDetailsError = true;
          this.passwordResetDetailsErrorMessage = errorMessage;
          this.passwordResetDetailsErrorMessage += '. You will be redirected to send another reset email shortly'

          setTimeout(() => {
            this.passwordResetDetailsError = false;
            this.passwordResetDetailsErrorMessage = '';
            this.showInitialResetForm = true;
          }, 5000);
        }); // End this.getPasswordResetDetails()
    } else {
      this.showInitialResetForm = true;
    }
  }

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

  sendResetEmail(): void {
    const promise = this.USER_SERVICE.sendPasswordResetEmail(this._emailAddress)
      .then(() => {
        this.showInitialResetForm = false;
        this.showEmailSentMessage = true;
      }) // End then()
      .catch((errorMessage: string) => {
        this.initialPasswordResetError = true;
        if (errorMessage === 'email_invalid') this.initialPasswordResetErrorMessage = 'That email address is invalid';
        else if (errorMessage === 'email_dne') this.initialPasswordResetErrorMessage = 'That email address does not exist';
        else this.initialPasswordResetErrorMessage = this.defaultErrorMessage;
      }); // End this.USER_SERVICE.sendPasswordResetEmail()
  } // End sendResetEmail()

  getPasswordResetDetails(_code: string = ''): Promise<string> {
    const promise = this.USER_SERVICE.getPasswordResetDetails(_code)
      .then((userId: string) => {
        if (this.UTILS.hasValue(userId)) return Promise.resolve(userId);
        else return Promise.reject(null);
      }) // End then(userId)
      .catch((getDetailsError: string) => {
        let errorMessage: string;
        if (typeof getDetailsError === 'string') {
          const firstPart: string = 'The password reset code in the URL';
          if (getDetailsError === 'code_invalid') errorMessage = `${firstPart} is invalid`;
          else if (getDetailsError === 'code_dne') errorMessage = `${firstPart} does not exist`;
          else if (getDetailsError === 'code_expired') errorMessage = `${firstPart} has expired`;
          else if (getDetailsError === 'code_used') errorMessage = `${firstPart} has already been used`;
          else errorMessage = this.defaultErrorMessage;
        } else errorMessage = this.defaultErrorMessage;

        return Promise.reject(errorMessage);
      }); // End this.USER_SERVICE.getPasswordResetDetails()

    return promise;
  } // End getPasswordResetDetails()

  resetPassword(): void {
    const promise = this.USER_SERVICE.resetPassword(this.escapedResetCode, this.userId, this._newPassword)
      .then(() => {
        this.showFinalResetForm = false;
        this.showSuccess = true;
        setTimeout(() => this.ROUTER.navigate(['/login']), 5000);
      }) // End then()
      .catch((resetPasswordError: any) => {
        this.finalResetError = true;

        let errorMessage: string;
        if (typeof resetPasswordError === 'string') {
          const firstPart: string = 'The password reset code in the URL';
          if (resetPasswordError === 'code_expired') errorMessage = `${firstPart} has expired`;
          else if (resetPasswordError === 'code_dne') errorMessage = `${firstPart} does not exist`;
          else if (resetPasswordError === 'code_used') errorMessage = `${firstPart} has already been used`;
          else if (resetPasswordError === 'code_mismatch') {
            errorMessage = this.defaultErrorMessage;
            console.error(resetPasswordError);
          } else errorMessage = this.defaultErrorMessage;
        } else if (Array.isArray(resetPasswordError)) {
          let invalidPassword: boolean = false;
          let invalidUserId: boolean = false;
          let invalidResetCode: boolean = false;

          resetPasswordError.forEach((invalidParam) => {
            if (invalidParam === 'newPassword') invalidPassword = true;
            else if (invalidParam === 'userId') invalidUserId = true;
            else if (invalidParam === 'resetCode') invalidResetCode = true;
            else console.error('Invalid param while resetting password: %s', invalidParam);
          });

          if (invalidPassword) errorMessage = 'Your new password is invalid. Please try again';
          if (invalidUserId) console.error('Invalid user ID while resetting password');
          if (invalidResetCode) console.error('Invalid reset code while resetting password');

          if (!invalidPassword) errorMessage = this.defaultErrorMessage;
        } else errorMessage = this.defaultErrorMessage;

        this.finalResetErrorMessage = errorMessage;
      }); // End this.USER_SERVICE.resetPassword()
  } // End resetPassword()
}
