import { Injectable } from '@angular/core';

import { Headers, Http, RequestOptions, Response } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { Router } from '@angular/router';
import { User } from '../objects/user';
import { Account } from '../objects/user';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

@Injectable()
export class UserService {
  private baseUrl = 'https://api.feasy-app.com';
  private contentType_UrlEncoded = 'application/x-www-form-urlencoded';
  private standardHeaders = new Headers({ 'Content-Type': this.contentType_UrlEncoded });

  private token: string;

  constructor(private _http: Http, private _router: Router) {}

  private handleError(error: any): Promise<any> {
    console.error('HTTP error: %s', error);
    if (error.status == 401) {
      localStorage.clear();
      this._router.navigate(['/login']);
    }

    return Promise.reject(error.message || error);
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

  create(user: User): Promise<User> {
    // Create request information
    let createUserUrl = `${this.baseUrl}/users`;

    // Add required parameters
    let requestParams = `username=${user.username}&password=${user.password}&email=${user.email}&firstName=${user.firstName}&lastName=${user.lastName}`;

    // Send request
    return this._http.post(createUserUrl, requestParams, { headers: this.standardHeaders })
      .toPromise()
      .then((response: Response) => {
        // TODO: Response will have JWT, so parse response for that and return it
        let body = response.json();
        return body.data || {};
      })
      .catch(this.handleError);
  }

  validate(username: string, password: string): Promise<string> {
    // Create request information
    let loginUrl = `${this.baseUrl}/login`;

    // Add required parameters
    let requestParams = `username=${username}&password=${password}`;

    // Send request
    return this._http.post(loginUrl, requestParams, { headers: this.standardHeaders })
      .toPromise()
      .then((response: Response) => {
        // FIXME: Do not set the localStorage in the service. It should be in the individual components
        let token = response.json().success.token;
        localStorage.setItem('currentUser', username);
        localStorage.setItem('token', token);
      })
      .catch(this.handleError);
  }
}
