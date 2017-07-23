import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';

import { User } from '../objects/user';
import { Account } from '../objects/user';

@Injectable()
export class UserService {
  private baseUrl = 'http://localhost:8080';
  private contentType_UrlEncoded = 'application/x-www-form-urlencoded';
  private standardHeaders = new Headers({ 'Content-Type': this.contentType_UrlEncoded });

  private token: string;

  constructor(private _http: Http, private _router: Router) {}

  private handleError(error: any): Promise<any> {
    // console.error('HTTP error: %s', error);
    if (error.status == 401) {
      localStorage.clear();
      this._router.navigate(['/login']);
    }

    return Promise.reject(error.message || error);
  }

  /**
   * create - Sends a request to create a new user
   * @param {User} user the user object
   * @return {Promise<string>} the authentication token for the newly created user
   */
  create(user: User): Promise<string> {
    // Create request information
    let createUserUrl = `${this.baseUrl}/users`;

    // Add required parameters
    let requestParams = `username=${user.username}&password=${user.password}&email=${user.email}`;

    // Attempt to add optional parameters
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
        // Extracts the token from the response body
        let responseBody = successResponse.json();
        let token: string = responseBody && responseBody.success && responseBody.success.token;
        return token != undefined ? token : null;
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

  get(): Promise<Account> {
    // Create request information
    let getUserUrl = `${this.baseUrl}/users/${localStorage['currentUser']}`;
    let headers = new Headers({
      'Content-Type': this.contentType_UrlEncoded,
      Authorization: localStorage['token'],
    });

    // Send request
    return this._http.get(getUserUrl, { headers: headers })
      .toPromise()
      .then((response: Response) => {
        console.log(response);
        let account: Account = response.json();
        return account;
      })
      .catch((error: any) => this.handleError(error));
  }

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
