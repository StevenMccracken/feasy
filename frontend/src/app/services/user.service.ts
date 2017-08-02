import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions, Response } from '@angular/http';

import { User } from '../objects/user';
import { Account } from '../objects/user';

@Injectable()
export class UserService {
  private token: string;
  private baseUrl = 'https://api.feasy-app.com';
  private contentType_UrlEncoded = 'application/x-www-form-urlencoded';
  private standardHeaders = new Headers({ 'Content-Type': this.contentType_UrlEncoded });

  constructor(private _http: Http, private _router: Router) {}

  /**
   *  Sends a request to create a new user
   * @param {User} user the user object
   * @return {Promise<string>} the authentication token for the newly created user
   */
  create(user: User): Promise<string> {
    // Create request information
    let createUserUrl = `${this.baseUrl}/users`;

    // Add required parameters
    let requestParams = `username=${user.username}&password=${user.password}&email=${user.email}`;

    // Add optional parameters
    if (user.firstName != undefined && user.firstName != '') {
      requestParams += `&firstName=${user.firstName}`
    };

    if (user.lastName != undefined && user.lastName != '') {
      requestParams += `&lastName=${user.lastName}`;
    }

    // Send request
    return this._http.post(createUserUrl, requestParams, { headers: this.standardHeaders })
      .toPromise()
      .then((successResponse: Response) => {
        // Extract the token from the response body
        let responseBody = successResponse.json();
        let token: string = responseBody && responseBody.success && responseBody.success.token;
        return token !== undefined ? token : null;
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
          if (errorMessage != undefined) {
            if (errorMessage.indexOf('username') != -1) duplicateParameter = 'username';
            else if (errorMessage.indexOf('email') != -1) duplicateParameter = 'email';
          }

          return Promise.reject(duplicateParameter);
        } else return Promise.reject(errorResponse);
      });
  }

  /**
   * Sends a request to get a user's profile
   * @param {string} username the desired user's username
   * @return {Promise<Account>} the user account information for the desired user
   */
  get(username: string): Promise<Account> {
    // Create request information
    let token: string = localStorage.getItem('token');

    let getUserUrl = `${this.baseUrl}/users/${username}`;
    let headers = new Headers({
      Authorization: token,
      'Content-Type': this.contentType_UrlEncoded,
    });

    // Send request
    return this._http.get(getUserUrl, { headers: headers })
      .toPromise()
      .then((successResponse: Response) => {
        let responseBody = successResponse.json();
        return new Account().deserialize(responseBody);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Sends a username and password to the /login API route to retrieve a token
   * @param {string} username the desired user's username
   * @param {string} password the desired user's password
   * @return {Promise<string>} the token to authenticate subsequent requests
   */
  validate(username: string, password: string): Promise<string> {
    // Create request information
    let loginUrl = `${this.baseUrl}/login`;

    // Add required parameters
    let requestParams = `username=${username}&password=${password}`;

    // Send request
    return this._http.post(loginUrl, requestParams, { headers: this.standardHeaders })
      .toPromise()
      .then((successResponse: Response) => {
        let responseBody = successResponse.json();
        let token = responseBody && responseBody.success && responseBody.success.token;
        return token != undefined ? token : null;
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }
}
