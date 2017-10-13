// Import angular packages
import {
  NgZone,
  Injectable,
} from '@angular/core';
import { Router } from '@angular/router';
import { Response } from '@angular/http';

// Import 3rd-party libraries
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import { GoogleAuthService } from 'ng-gapi/lib/GoogleAuthService';

// Import our files
import { User } from '../objects/user';
import { Account } from '../objects/account';
import { FeasyService } from './feasy.service';
import { ErrorService } from './error.service';
import { LocalError } from '../objects/local-error';
import { RemoteError } from '../objects/remote-error';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';
import { InvalidRequestError } from '../objects/invalid-request-error';

@Injectable()
export class UserService {
  constructor(
    private ROUTER: Router,
    private ERROR: ErrorService,
    private FEASY_API: FeasyService,
    private UTILS: CommonUtilsService,
    private STORAGE: LocalStorageService,
    private GOOGLE_AUTH_SERVICE: GoogleAuthService,
  ) {}

  /**
   * Sends a request to create a new user
   * @param {User} [_user = new User()] the user object
   * @param {string} [_alphaCode = ''] the special access alpha code
   * @return {Promise<string>} the authentication token for the newly created user
   */
  create(_user: User = new User(), _alphaCode: string = ''): Promise<string> {
    const createUserPath: string = '/users';
    const requestParams: Object = {
      username: _user.username,
      password: _user.password,
      email: _user.email,
      alphaCode: _alphaCode,
    };

    // Add optional parameters
    if (this.UTILS.hasValue(_user.firstName) && _user.firstName !== '') requestParams['firstName'] = _user.firstName;
    if (this.UTILS.hasValue(_user.lastName) && _user.lastName !== '') requestParams['lastName'] = _user.lastName;
    if (this.UTILS.hasValue(_user.avatar) && _user.avatar !== '') requestParams['avatar'] = _user.avatar;

    const promise = this.FEASY_API.post(createUserPath, requestParams)
      .then((successResponse: Response) => {
        // Extract the token from the response body
        const responseBody = successResponse.json();
        const token: string = responseBody && responseBody.success && responseBody.success.token;

        if (this.UTILS.hasValue(token)) return Promise.resolve(token);
        else {
          const error: LocalError = new LocalError('user.service.create');
          error.setType('null_token');
          error.setMessage('No token was returned when creating the user succeeded');

          return Promise.reject(error);
        }
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        if (errorResponse instanceof Response) {
          const error: RemoteError = this.ERROR.getRemoteError(errorResponse);

          if (this.ERROR.isInvalidRequestError(error)) {
            // The request contains invalid/malformed parameters from the user's attributes
            const invalidParameters: string[] = this.ERROR.getInvalidParameters(error);

            // Add the invalid parameters to the error object
            error.setCustomProperty('invalidParameters', invalidParameters);
          } else if (this.ERROR.isResourceError(error)) {
            // A user with either the username, email, or access code already exists
            let duplicateParameter: string;
            const errorMessage: string = error.getMessage();
            if (this.UTILS.hasValue(errorMessage)) {
              if (errorMessage.indexOf('username') !== -1) duplicateParameter = 'username';
              else if (errorMessage.indexOf('email') !== -1) duplicateParameter = 'email';
              else if (errorMessage.indexOf('alpha') !== -1) duplicateParameter = 'alphaCode';
              else duplicateParameter = '';
            }

            // Add the duplicate parameter to the error object
            error.setCustomProperty('duplicateParameter', duplicateParameter);
          }

          return Promise.reject(error);
        } else return Promise.reject(errorResponse);
      }); // End this.FEASY_API.post()

    return promise;
  } // End create()

  /**
   * Sends a request to get a user's profile
   * @param {string} _username the desired user's username
   * @return {Promise<Account>} the user account information for the desired user
   */
  get(_username: string): Promise<Account> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const getUserPath = `/users/${_username}`;
    const headersOptions = { Authorization: token };

    // Send request
    const promise = this.FEASY_API.get(getUserPath, headersOptions)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const userAccount = new Account().deserialize(responseBody);
        return Promise.resolve(userAccount);
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        const error: RemoteError = this.ERROR.getRemoteError(errorResponse);
        if (this.ERROR.isInvalidRequestError(error)) error.setCustomProperty('invalidParameter', 'username');

        return Promise.reject(error);
      }); // End this.FEASY_API.get()

    return promise;
  } // End get()

  /**
   * Sends a request to update an attribute for the current user
   * @param {string} _attribute the name of the user attribute to update
   * @param {any} _newValue the new value for the user's attribute
   * @return {Promise<Response>} the Response object from the API
   */
  private update(_attribute: string, _newValue: any): Promise<Response> {
    // Create request information
    const token = this.STORAGE.getItem('token');
    const username = this.STORAGE.getItem('currentUser');
    const updatePath = `/users/${username}/${_attribute}`;
    const headersOptions = { Authorization: token };

    // Add required parameters
    const capitalizedAttribute = `${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;
    const requestParams = { [`new${capitalizedAttribute}`]: _newValue };

    // Send request
    const promise = this.FEASY_API.put(updatePath, requestParams, headersOptions)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((updateError: Response) => {
        const error: RemoteError = this.ERROR.getRemoteError(updateError);

        if (this.ERROR.isInvalidRequestError(error)) {
          const invalidRequestError: InvalidRequestError = new InvalidRequestError(error);
          return Promise.reject(invalidRequestError);
        } else if (this.ERROR.isResourceError()) {
          const errorMessage: string = error.getMessage() || '';
          if (/another/gi.test(errorMessage)) error.setCustomProperty('reason', 'updating_different_user');
          else if (/google/gi.test(errorMessage)) error.setCustomProperty('reason', 'google_user');
          else error.setCustomProperty('reason', 'unknown');

          return Promise.reject(error);
        } else return promise.reject(error);
      }); // End this.FEASY_API.put()

    return promise;
  } // End update()

  /**
   * Sends a request to update a user's avatar
   * @param {string} _newAvatar the new avatar to update the user with
   * @return {Promise<any>} an empty resolved promise
   */
  updateAvatar(_newAvatar: string): Promise<any> {
    const promise = this.update('avatar', _newAvatar)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateAvatar()

  /**
   * Sends a username and password to the /login API route to retrieve a token
   * @param {string} _username the desired user's username
   * @param {string} _password the desired user's password
   * @return {Promise<string>} the token to authenticate subsequent requests
   */
  getAuthToken(_username: string, _password: string): Promise<string> {
    // Create request information
    const loginPath = '/login';
    const requestParams = {
      username: _username,
      password: _password,
    };

    // Send request
    const promise = this.FEASY_API.post(loginPath, requestParams)
      .then((successResponse: Response) => {
        // Extract the token from the response body
        const responseBody = successResponse.json();
        const token: string = responseBody && responseBody.success && responseBody.success.token;

        if (this.UTILS.hasValue(token)) return Promise.resolve(token);
        else {
          const error: LocalError = new LocalError('user.service.getAuthToken');
          error.setType('null_token');
          error.setMessage('No token was returned when logging in the user succeeded');

          return Promise.reject(error);
        }
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        if (errorResponse instanceof Response) {
          const error: RemoteError = this.ERROR.getRemoteError(errorResponse);

          if (this.ERROR.isInvalidRequestError(error)) {
            // The request contains invalid/malformed parameters from the username or password
            const invalidParameters: string[] = this.ERROR.getInvalidParameters(error);

            // Add the invalid parameters to the error object
            error.setCustomProperty('invalidParameters', invalidParameters);
          } else if (this.ERROR.isResourceError(error)) {
            // A Google user tried to log in with a username and password
          }

          return Promise.reject(error);
        } else return Promise.reject(errorResponse);
      }); // End this.FEASY_API.post()

    return promise;
  } // End getAuthToken()

  /**
   * Sends an existing token from local storage to the /login/refresh API route to refresh the token
   * @return {Promise<string>} the token to authenticate subsequent requests
   */
  refreshAuthToken(): Promise<string> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const refreshTokenPath = '/login/refresh';
    const headersOptions = { Authorization: token };

    // Send request
    const promise = this.FEASY_API.get(refreshTokenPath, headersOptions)
      .then((successResponse: Response) => {
        // Extract the token from the response body
        const responseBody = successResponse.json();
        const newtoken: string = responseBody && responseBody.success && responseBody.success.token;

        if (this.UTILS.hasValue(newtoken)) return Promise.resolve(newtoken);
        else {
          const error: LocalError = new LocalError('user.service.refreshAuthToken');
          error.setType('null_token');
          error.setMessage('No token was returned when refreshing the token succeeded');

          return Promise.reject(error);
        }
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        if (errorResponse instanceof Response) {
          const error: RemoteError = this.ERROR.getRemoteError(errorResponse);
          return Promise.reject(error);
        } else return Promise.reject(errorResponse);
      }); // End this.FEASY_API.get()

    return promise;
  } // End refreshAuthToken()

  /**
   * Retrieves the Feasy-specific Google OAuth2.0 URL for authenticating offline access
   * @return {Promise<string>} the authentication URL that contains the HTML content to authenticate
   */
  getAuthorizationUrl(): Promise<string> {
    // Create request information
    const getAuthPath = '/auth/googleUrl';

    // Send request
    const promise = this.FEASY_API.get(getAuthPath)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const authUrl: string = responseBody && responseBody.success && responseBody.success.authUrl;

        if (this.UTILS.hasValue(authUrl)) return Promise.resolve(authUrl);
        else {
          const error: LocalError = new LocalError('user.service.getAuthorizationUrl');
          error.setType('null_url');
          error.setMessage('No authorization URL was returned when getting the authorization URL succeeded');

          return Promise.reject(error);
        }
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        if (errorResponse instanceof Response) {
          const error: RemoteError = this.ERROR.getRemoteError(errorResponse);
          return Promise.reject(error);
        } else return Promise.reject(errorResponse);
      }); // End this.FEASY_API.get()

    return promise;
  } // End getAuthorizationUrl()

  /**
   * Retrieves authentication info to login the user once
   * they have granted Feasy offline access. Will only work
   * if the Feasy-specific OAuth2.0 URL is accessed first
   * @param {string} [_alphaCode = ''] the unique access code to sign up with
   * @return {Promise<Object>} the JSON containing the user's username and a JWT
   */
  authenticateGoogle(_alphaCode: string = ''): Promise<Object> {
    // Create request information
    const authenticatePath = `/auth/google/await?alphaCode=${_alphaCode}`;

    // Send request
    const promise = this.FEASY_API.get(authenticatePath)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const token: string = responseBody && responseBody.success && responseBody.success.token;
        const username: string = responseBody && responseBody.success && responseBody.success.username;

        const authInfo: Object = {};
        let validToken: boolean = true;
        let validUsername: boolean = true;

        if (this.UTILS.hasValue(token)) authInfo['token'] = token;
        else validToken = false;

        if (this.UTILS.hasValue(username)) authInfo['username'] = token;
        else validUsername = false;

        if (validToken && validUsername) return Promise.resolve(authInfo);
        else {
          const error: LocalError = new LocalError('user.service.authenticateGoogle');
          error.setType('null_authInfo');
          error.setMessage('No authorization URL was returned when getting the authorization URL succeeded');

          const nullInfo: string[] = [];
          if (!validToken) nullInfo.push('token');
          if (!validUsername) nullInfo.push('username');

          error.setCustomProperty('nullAuthInfo', nullInfo);
          return Promise.reject(error);
        }
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        if (errorResponse instanceof Response) {
          const error: RemoteError = this.ERROR.getRemoteError(errorResponse);

          if (this.ERROR.isInvalidRequestError(error)) {
            // The request contains invalid/malformed parameters from the username or password
            const invalidParameters: string[] = this.ERROR.getInvalidParameters(error);

            // Add the invalid parameters to the error object
            error.setCustomProperty('invalidParameters', invalidParameters);
          } else if (this.ERROR.isResourceError(error)) {
            // The provided alpha code has already been used or the username/email is taken
            const errorMessage: string = error.getMessage() || '';
            if (errorMessage.indexOf('alpha code') !== -1) error.setCustomProperty('invalidResource', 'alphaCode');
            else if (errorMessage.indexOf('username') !== -1) error.setCustomProperty('invalidResource', 'username');
            else if (errorMessage.indexOf('email') !== -1) error.setCustomProperty('invalidResource', 'email');
          }
        } else return Promise.reject(errorResponse);
      }); // End this.FEASY_API.get()

    return promise;
  } // End authenticateGoogle()

  /**
   * Sends an API request to send a password reset email to the desired email address
   * @param {string} _email the email address to send the password reset email to
   * @return {Promise<any>} an empty Promise
   */
  sendPasswordResetEmail(_email: string): Promise<any> {
    // Create request information
    const resetEmailPath: string = `/password/reset`;
    const requestParams: Object = { email: _email };

    // Send request
    const promise = this.FEASY_API.post(resetEmailPath, requestParams)
      .then((successResponse: Response) => Promise.resolve()) // End then(successResponse)
      .catch((errorResponse: Response) => {
        const error: RemoteError = this.ERROR.getRemoteError(errorResponse);

        if (this.ERROR.isInvalidRequestError(error)) {
          const invalidParams: string[] = this.ERROR.getInvalidParameters(error);
          error.setCustomProperty('invalidParameters', invalidParams);
        }

        return Promise.reject(error);
      }); // End this.FEASY_API.post()

    return promise;
  } // End sendPasswordResetEmail()

  getPasswordResetDetails(_resetCode: string): Promise<Object> {
    // Create request information
    const resetDetailsPath: string = `/password/reset/details?code=${_resetCode}`;

    // Send request
    const promise = this.FEASY_API.get(resetDetailsPath)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const userDetails: Object = (responseBody && responseBody.success) || {};

        if (this.UTILS.hasValue(userDetails['userId'])) return Promise.resolve(userDetails);
        else {
          const error: LocalError = new LocalError('user.service.getPasswordResetDetails');
          error.setType('null_userDetails');
          error.setMessage('No userId was returned when getting the password reset details succeeded');

          return Promise.reject(error);
        }
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        if (errorResponse instanceof Response) {
          const error: RemoteError = this.ERROR.getRemoteError(errorResponse);

          if (this.ERROR.isInvalidRequestError(error)) {
            // The request contains invalid/malformed parameters from the username or password
            const invalidParameters: string[] = this.ERROR.getInvalidParameters(error);

            // Add the invalid parameters to the error object
            error.setCustomProperty('invalidParameters', invalidParameters);
          } else if (this.ERROR.isResourceError(error)) {
            // The provided alpha code has already been used or the username/email is taken
            const errorMessage: string = error.getMessage() || '';
            if (errorMessage.indexOf('expired') !== -1) error.setCustomProperty('invalidResourceReason', 'expired');
            else if (errorMessage.indexOf('already') !== -1) error.setCustomProperty('invalidResourceReason', 'used');
          }

          return Promise.reject(error);
        } else return Promise.reject(errorResponse);
      }); // End this.FEASY_API.get()

    return promise;
  } // End getPasswordResetDetails()

  /**
   * Sends a request to reset a user's password without knowing the existing password
   * @param {string} _resetCode the unique password reset code that was emailed to the user
   * @param {string} _userId the userId of the user
   * @param {string} _password the new password for the user
   * @return {Promise<any>} an empty promise
   */
  resetPassword(_resetCode: string, _userId: string, _password: string): Promise<any> {
    // Create request information
    const resetPasswordPath: string = '/password/reset/callback';
    const requestParams: Object = {
      resetCode: _resetCode,
      userId: _userId,
      newPassword: _password,
    };

    // Send request
    const promise = this.FEASY_API.post(resetPasswordPath, requestParams)
      .then((successResponse: Response) => Promise.resolve()) // End then(successResponse)
      .catch((errorResponse: Response) => {
        const error: RemoteError = this.ERROR.getRemoteError(errorResponse);

        if (this.ERROR.isInvalidRequestError(error)) {
          // The request contains invalid/malformed parameters from the username or password
          const invalidParameters: string[] = this.ERROR.getInvalidParameters(error);

          // Add the invalid parameters to the error object
          error.setCustomProperty('invalidParameters', invalidParameters);
        } else if (this.ERROR.isResourceError(error)) {
          // The provided alpha code has already been used or the username/email is taken
          const errorMessage: string = error.getMessage() || '';
          if (errorMessage.indexOf('expired') !== -1) error.setCustomProperty('invalidResourceReason', 'expired');
          else if (errorMessage.indexOf('already') !== -1) error.setCustomProperty('invalidResourceReason', 'used');
          else if (errorMessage.indexOf('match') !== -1) error.setCustomProperty('invalidResourceReason', 'mismatch');
        }

        return Promise.reject(error);
      }); // End this.FEASY_API.post()

    return promise;
  } // End resetPassword()
}
