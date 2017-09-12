// Import angular packages
import {
  NgZone,
  Injectable,
} from '@angular/core';
import { Router } from '@angular/router';
import { Response } from '@angular/http';

// Import 3rd party libraries
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import { GoogleAuthService } from 'ng-gapi/lib/GoogleAuthService';

// Import our files
import { User } from '../objects/user';
import { Account } from '../objects/account';
import { FeasyService } from './feasy.service';
import { ErrorService } from './error.service';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

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

    return this._feasyApi.post(createUserPath, requestParams)
      .then((successResponse: Response) => {
        // Extract the token from the response body
        const responseBody = successResponse.json();
        const token: string = responseBody && responseBody.success && responseBody.success.token;
        return Promise.resolve(this._utils.hasValue(token) ? token : null);
      })
      .catch((errorResponse: Response) => {
        const error = this._error.getError(errorResponse);
        if (this._error.isInvalidRequestError(error)) {
          const invalidParams = this._error.getInvalidParameters(error);
        }

        /*
         * Return detailed errors for invalid request error or
         * resource errors. Otherwise, return the response object
         */
        if (this._error.isInvalidRequestError(error)) {
          // The request contains invalid/malformed parameters from the user's attributes
          const invalidParameters = this._error.getInvalidParameters(error);
          return Promise.reject(invalidParameters);
        } else if (this._error.isResourceError(error)) {
          // A user with either the username, email, or access code already exists
          let duplicateParameter: string;
          const errorMessage: string = error.getMessage();
          if (this._utils.hasValue(errorMessage)) {
            if (errorMessage.indexOf('username') !== -1) duplicateParameter = 'username';
            else if (errorMessage.indexOf('email') !== -1) duplicateParameter = 'email';
            else if (errorMessage.indexOf('alpha') !== -1) duplicateParameter = 'alpha';
            else duplicateParameter = '';
          }

          return Promise.reject(duplicateParameter);
        } else return Promise.reject(error);
      });
  }

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
    return this._feasyApi.get(getUserPath, headersOptions)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        return Promise.resolve(new Account().deserialize(responseBody));
      })
      .catch((errorResponse: Response) => {
        const error = this._error.getError(errorResponse);
        Promise.reject(error);
      });
  }

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
    return this._feasyApi.put(updatePath, requestParams, headersOptions)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((updateError: Response) => {
        // Return detailed errors for invalid request error. Otherwise, return the response object
        if (updateError.status === 400) {
          const responseBody = updateError.json();
          const errorMessage: string = (responseBody &&
            responseBody.error &&
            responseBody.error.message) ||
            '';

          // The request contains invalid/malformed parameters from the assignment's attributes
          let errorReason;
          if (/[iI]nvalid/.test(errorMessage)) errorReason = 'invalid';
          else if (/[uU]nchanged/.test(errorMessage)) errorReason = 'unchanged';
          else errorReason = 'unknown';

          return Promise.reject(errorReason);
        } else return Promise.reject(updateError);
      });
  }

  /**
   * Sends a request to update a user's avatar
   * @param {string} _newAvatar the new avatar to update the user with
   * @return {Promise<any>} an empty resolved promise
   */
  updateAvatar(_newAvatar: string): Promise<any> {
    return this.update('avatar', _newAvatar)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a username and password to the /login API route to retrieve a token
   * @param {string} _username the desired user's username
   * @param {string} _password the desired user's password
   * @return {Promise<string>} the token to authenticate subsequent requests
   */
  validate(_username: string, _password: string): Promise<string> {
    // Create request information
    const loginPath = '/login';
    const requestParams = {
      username: _username,
      password: _password,
    };

    // Send request
    return this._feasyApi.post(loginPath, requestParams)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const token: string = responseBody && responseBody.success && responseBody.success.token;
        return Promise.resolve(this._utils.hasValue(token) ? token : null);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

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
    return this._feasyApi.get(refreshTokenPath, headersOptions)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const newToken: string = responseBody && responseBody.success && responseBody.success.token;
        return Promise.resolve(this._utils.hasValue(newToken) ? newToken : null);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Retrieves the Feasy-specific Google OAuth2.0 URL for authenticating offline access
   * @return {Promise<string>} the authentication URL that contains the HTML content to authenticate
   */
  getAuthorizationUrl(): Promise<string> {
    // Create request information
    const getAuthPath = '/auth/googleUrl';

    // Send request
    return this._feasyApi.get(getAuthPath)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const authUrl: string = responseBody && responseBody.success && responseBody.success.authUrl;
        return Promise.resolve(this._utils.hasValue(authUrl) ? authUrl : null);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

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
    return this._feasyApi.get(authenticatePath)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();
        const token: string = responseBody && responseBody.success && responseBody.success.token;
        const username: string = responseBody && responseBody.success && responseBody.success.username;

        const authInfo = {
          token: this._utils.hasValue(token) ? token : null,
          username: this._utils.hasValue(username) ? username : null,
        };

        return Promise.resolve(authInfo);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }
}
