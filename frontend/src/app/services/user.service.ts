import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import { Router } from '@angular/router';
import { Response } from '@angular/http';
import { Injectable, NgZone } from '@angular/core';
import { GoogleAuthService } from 'ng-gapi/lib/GoogleAuthService';

import { User } from '../objects/user';
import { Account } from '../objects/user';
import { FeasyService } from './feasy.service';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

@Injectable()
export class UserService {
  constructor(
    private _router: Router,
    private _feasyApi: FeasyService,
    private _utils: CommonUtilsService,
    private _storage: LocalStorageService,
    private _googleAuthService: GoogleAuthService
  ) {}

  /**
   * Sends a request to create a new user
   * @param {User = new User()} _user the user object
   * @return {Promise<string>} the authentication token for the newly created user
   */
  create(_user: User = new User()): Promise<string> {
    let createUserPath = '/users';
    let requestParams = {
      username: _user.username,
      password: _user.password,
      email: _user.email,
    };

    // Add optional parameters
    if (this._utils.hasValue(_user.firstName) && _user.firstName !== '') {
      requestParams['firstName'] = _user.firstName;
    }

    if (this._utils.hasValue(_user.lastName) && _user.lastName !== '') {
      requestParams['lastName'] = _user.lastName;
    }

    return this._feasyApi.post(createUserPath, requestParams)
      .then((successResponse: Response) => {
        // Extract the token from the response body
        let responseBody = successResponse.json();
        let token: string = responseBody && responseBody.success && responseBody.success.token;
        return Promise.resolve(this._utils.hasValue(token) ? token : null);
      })
      .catch((errorResponse: Response) => {
        let responseBody = errorResponse.json();
        let errorMessage: string = responseBody && responseBody.error && responseBody.error.message;

        /*
         * Return detailed errors for invalid request error or
         * resource errors. Otherwise, return the response object
         */
        if (errorResponse.status == 400) {
          // The request contains invalid/malformed parameters from the user's attributes
          let commaSeparatedParams: string;
          if (errorMessage == undefined) commaSeparatedParams = '';
          else commaSeparatedParams = errorMessage.split('Invalid parameters: ')[1];

          // Comma separated params should be something like username,email,firstName
          let invalidParameters = commaSeparatedParams.split(',');
          return Promise.reject(invalidParameters);
        } else if (errorResponse.status == 403) {
          // A user with either the username or email already exists
          let duplicateParameter = '';
          if (errorMessage !== undefined) {
            if (errorMessage.indexOf('username') !== -1) duplicateParameter = 'username';
            else if (errorMessage.indexOf('email') !== -1) duplicateParameter = 'email';
          }

          return Promise.reject(duplicateParameter);
        } else return Promise.reject(errorResponse);
      });
  }

  /**
   * Sends a request to get a user's profile
   * @param {string} _username the desired user's username
   * @return {Promise<Account>} the user account information for the desired user
   */
  get(_username: string): Promise<Account> {
    // Create request information
    let token: string = this._storage.getItem('token');
    let getUserPath = `/users/${_username}`;
    let headersOptions = { 'Authorization': token };

    // Send request
    return this._feasyApi.get(getUserPath, headersOptions)
      .then((successResponse: Response) => {
        let responseBody = successResponse.json();
        return Promise.resolve(new Account().deserialize(responseBody));
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Sends a username and password to the /login API route to retrieve a token
   * @param {string} _username the desired user's username
   * @param {string} _password the desired user's password
   * @return {Promise<string>} the token to authenticate subsequent requests
   */
  validate(_username: string, _password: string, _alphaCode: string): Promise<string> {
    // Create request information
    let loginPath = '/login';
    let requestParams = {
      username: _username,
      password: _password,
      alphaCode: _alphaCode
    };

    // Send request
    return this._feasyApi.post(loginPath, requestParams)
      .then((successResponse: Response) => {
        let responseBody = successResponse.json();
        let token: string = responseBody && responseBody.success && responseBody.success.token;
        return Promise.resolve(token === undefined ? null : token);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Retrieves the Feasy-specific Google OAuth2.0 URL for authenticating offline access
   * @return {Promise<string>} the authentication URL that contains the HTML content to authenticate
   */
  getAuthorizationUrl(): Promise<string> {
    // Create request information
    let getAuthPath = '/auth/googleUrl';

    // Send request
    return this._feasyApi.get(getAuthPath)
      .then((successResponse: Response) => {
        let responseBody = successResponse.json();
        let authUrl: string = responseBody && responseBody.success && responseBody.success.authUrl;
        return Promise.resolve(authUrl === undefined ? null : authUrl);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Retrieves authentication info to login the user once
   * they have granted Feasy offline access. Will only work
   * if the Feasy-specific OAuth2.0 URL is accessed first
   * @return {Promise<Object>} the JSON containing the user's username and a JWT
   */
  authenticateGoogle(): Promise<Object> {
    // Create request information
    let authenticatePath = '/auth/google/await';

    // Send request
    return this._feasyApi.get(authenticatePath)
      .then((successResponse: Response) => {
        let responseBody = successResponse.json();
        let token: string = responseBody && responseBody.success && responseBody.success.token;
        let username: string = responseBody && responseBody.success && responseBody.success.username;
        let authInfo = {
          token: token === undefined ? null : token,
          username: username === undefined ? null : username,
        };

        return Promise.resolve(authInfo);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }
}
