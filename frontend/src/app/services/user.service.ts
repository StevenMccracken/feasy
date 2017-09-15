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
    private _router: Router,
    private _error: ErrorService,
    private _feasyApi: FeasyService,
    private _utils: CommonUtilsService,
    private _storage: LocalStorageService,
    private _googleAuthService: GoogleAuthService,
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
    if (this._utils.hasValue(_user.firstName) && _user.firstName !== '') {
      requestParams['firstName'] = _user.firstName;
    }

    if (this._utils.hasValue(_user.lastName) && _user.lastName !== '') {
      requestParams['lastName'] = _user.lastName;
    }

    if (this._utils.hasValue(_user.avatar) && _user.avatar !== '') {
      requestParams['avatar'] = _user.avatar;
    }

    const promise = this._feasyApi.post(createUserPath, requestParams)
      .then((successResponse: Response) => {
        // Extract the token from the response body
        const responseBody = successResponse.json();
        const token: string = responseBody && responseBody.success && responseBody.success.token;

        if (this._utils.hasValue(token)) return Promise.resolve(token);
        else {
          const error: LocalError = new LocalError('user.service.create');
          error.setType('null_token');
          error.setMessage('No token was returned when creating the user succeeded');

          return Promise.reject(error);
        }
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        if (errorResponse instanceof Response) {
          const error: RemoteError = this._error.getRemoteError(errorResponse);

          if (this._error.isInvalidRequestError(error)) {
            // The request contains invalid/malformed parameters from the user's attributes
            const invalidParameters: string[] = this._error.getInvalidParameters(error);

            // Add the invalid parameters to the error object
            error.setCustomProperty('invalidParameters', invalidParameters);
          } else if (this._error.isResourceError(error)) {
            // A user with either the username, email, or access code already exists
            let duplicateParameter: string;
            const errorMessage: string = error.getMessage();
            if (this._utils.hasValue(errorMessage)) {
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
      }); // End this._feasyApi.post()

    return promise;
  } // End create()

  /**
   * Sends a request to get a user's profile
   * @param {string} _username the desired user's username
   * @return {Promise<Account>} the user account information for the desired user
   */
  get(_username: string): Promise<Account> {
    // Create request information
    const token: string = this._storage.getItem('token');
    const getUserPath = `/users/${_username}`;
    const headersOptions = { Authorization: token };

    // Send request
    const promise = this._feasyApi.get(getUserPath, headersOptions)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const userAccount = new Account().deserialize(responseBody);
        return Promise.resolve(userAccount);
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        const error: RemoteError = this._error.getRemoteError(errorResponse);
        if (this._error.isInvalidRequestError(error)) error.setCustomProperty('invalidParameter', 'username');

        return Promise.reject(error);
      }); // End this._feasyApi.get()

    return promise;
  } // End get()

  /**
   * Sends a request to update an attribute for the current user
   * @param {string} _attribute the name of the user attribute to update
   * @param {any} _newValue the new value for the user's attribute
   * @return {Promise<any>} the Response object from the API
   */
  private update(_attribute: string, _newValue: any): Promise<any> {
    // Create request information
    const token = this._storage.getItem('token');
    const username = this._storage.getItem('currentUser');
    const updatePath = `/users/${username}/${_attribute}`;
    const headersOptions = { Authorization: token };

    // Add required parameters
    const capitalizedAttribute = `${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;
    const requestParams = { [`new${capitalizedAttribute}`]: _newValue };

    // Send request
    const promise = this._feasyApi.put(updatePath, requestParams, headersOptions)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((updateError: Response) => {
        const error: RemoteError = this._error.getRemoteError(updateError);

        if (this._error.isInvalidRequestError(error)) {
          const invalidRequestError: InvalidRequestError = new InvalidRequestError(error);
          return Promise.reject(invalidRequestError);
        } else if (this._error.isResourceError()) {
          const errorMessage: string = error.getMessage() || '';
          if (/another/gi.test(errorMessage)) error.setCustomProperty('reason', 'updating_different_user');
          else if (/google/gi.test(errorMessage)) error.setCustomProperty('reason', 'google_user');
          else error.setCustomProperty('reason', 'unknown');

          return Promise.reject(error);
        } else return promise.reject(error);
      }); // End this._feasyApi.put()

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
    const promise = this._feasyApi.post(loginPath, requestParams)
      .then((successResponse: Response) => {
        // Extract the token from the response body
        const responseBody = successResponse.json();
        const token: string = responseBody && responseBody.success && responseBody.success.token;

        if (this._utils.hasValue(token)) return Promise.resolve(token);
        else {
          const error: LocalError = new LocalError('user.service.getAuthToken');
          error.setType('null_token');
          error.setMessage('No token was returned when logging in the user succeeded');

          return Promise.reject(error);
        }
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        if (errorResponse instanceof Response) {
          const error: RemoteError = this._error.getRemoteError(errorResponse);

          if (this._error.isInvalidRequestError(error)) {
            // The request contains invalid/malformed parameters from the username or password
            const invalidParameters: string[] = this._error.getInvalidParameters(error);

            // Add the invalid parameters to the error object
            error.setCustomProperty('invalidParameters', invalidParameters);
          } else if (this._error.isResourceError(error)) {
            // A Google user tried to log in with a username and password
          }

          return Promise.reject(error);
        } else return Promise.reject(errorResponse);
      }); // End this._feasyApi.post()

    return promise;
  } // End getAuthToken()

  /**
   * Sends an existing token from local storage to the /login/refresh API route to refresh the token
   * @return {Promise<string>} the token to authenticate subsequent requests
   */
  refreshAuthToken(): Promise<string> {
    // Create request information
    const token: string = this._storage.getItem('token');
    const refreshTokenPath = '/login/refresh';
    const headersOptions = { Authorization: token };

    // Send request
    const promise = this._feasyApi.get(refreshTokenPath, headersOptions)
      .then((successResponse: Response) => {
        // Extract the token from the response body
        const responseBody = successResponse.json();
        const newtoken: string = responseBody && responseBody.success && responseBody.success.token;

        if (this._utils.hasValue(newtoken)) return Promise.resolve(newtoken);
        else {
          const error: LocalError = new LocalError('user.service.refreshAuthToken');
          error.setType('null_token');
          error.setMessage('No token was returned when refreshing the token succeeded');

          return Promise.reject(error);
        }
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        if (errorResponse instanceof Response) {
          const error: RemoteError = this._error.getRemoteError(errorResponse);
          return Promise.reject(error);
        } else return Promise.reject(errorResponse);
      }); // End this._feasyApi.get()

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
    const promise = this._feasyApi.get(getAuthPath)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const authUrl: string = responseBody && responseBody.success && responseBody.success.authUrl;
        return Promise.resolve(this._utils.hasValue(authUrl) ? authUrl : null);
      }) // End then(successResponse)
      .catch((errorResponse: Response) => Promise.reject(errorResponse)); // End this._feasyApi.get()

    return promise;
  } // End getAuthorizationUrl()

  /**
   * Retrieves authentication info to login the user once
   * they have granted Feasy offline access. Will only work
   * if the Feasy-specific OAuth2.0 URL is accessed first
   * @return {Promise<Object>} the JSON containing the user's username and a JWT
   */
  authenticateGoogle(_alphaCode: string = ''): Promise<Object> {
    // Create request information
    const authenticatePath = `/auth/google/await?alphaCode=${_alphaCode}`;

    // Send request
    const promise = this._feasyApi.get(authenticatePath)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const token: string = responseBody && responseBody.success && responseBody.success.token;
        const username: string = responseBody && responseBody.success && responseBody.success.username;

        const authInfo = {
          token: this._utils.hasValue(token) ? token : null,
          username: this._utils.hasValue(username) ? username : null,
        };

        return Promise.resolve(authInfo);
      }) // End then(successResponse)
      .catch((errorResponse: Response) => Promise.reject(errorResponse)); // End this._feasyApi.get()

    return promise;
  }
}
