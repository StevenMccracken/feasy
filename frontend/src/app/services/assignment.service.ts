import { Router } from '@angular/router';
import { Injectable, OnInit} from '@angular/core';
import { Headers, Http, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';

import { Assignment } from '../objects/assignment';

@Injectable()
export class AssignmentService implements OnInit {
  private baseUrl = 'https://api.feasy-app.com';
  private contentType_UrlEncoded = 'application/x-www-form-urlencoded';
  private standardHeaders = new Headers({ 'Content-Type': this.contentType_UrlEncoded });

  private token: string;
  username: string;

  constructor(private _http: Http, private _router: Router) {}

  ngOnInit() {
    this.token = localStorage.getItem('token');
    this.username = localStorage.getItem('currentUser');
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

  create(assignment: Assignment): Promise<any> {
    // Create request information
    let createUrl = `${this.baseUrl}/users/${localStorage['currentUser']}/assignments`;
    let headers = new Headers({
      'Authorization': localStorage['token'],
      'Content-Type': this.contentType_UrlEncoded,
    });

    // Add required parameters
    let dateUnixSeconds = assignment.dueDate.getTime() / 1000;
    let requestParams = `title=${assignment.title}&dueDate=${dateUnixSeconds}`;

    // Attempt to add optional assignment attributes
    if (assignment.class !== undefined && assignment.class !== null) {
      requestParams = `${requestParams}&class=${assignment.class}`;
    }

    if (assignment.type !== undefined && assignment.type !== null) {
      requestParams = `${requestParams}&type=${assignment.type}`;
    }

    if (assignment.description !== undefined && assignment.description !== null) {
      requestParams = `${requestParams}&description=${assignment.description}`;
    }

    if (assignment.completed !== undefined && assignment.completed !== null) {
      requestParams = `${requestParams}&completed=${assignment.completed}`;
    }

    // Send request
    return this._http.post(createUrl, requestParams, { headers: headers })
      .toPromise()
      .then((response: Response) => { return response; })
      .catch(this.handleError)
  }

  get(): Promise<Assignment[]> {
    // Create request information
    let getUrl = `${this.baseUrl}/users/${localStorage['currentUser']}/assignments`;
    let headers = new Headers({
      Authorization: localStorage['token'],
      'Content-Type': this.contentType_UrlEncoded,
    });

    // Send request
    return this._http.get(getUrl, { headers: headers })
      .toPromise()
      .then((response: Response) => {
        let data = response.json();

        // Process assignments JSON to Assignment objects array
        let assignments: Assignment[] = [];
        for (let assignment in data) assignments.push(data[assignment]);
        return assignments;
      })
      .catch(this.handleError);
  }

  update(assignmentId: string, description: string): Promise<any> {
    // Create request information
    let updateUrl = `${this.baseUrl}/users/${localStorage['currentUser']}/assignments/${assignmentId}/description`;
    let headers = new Headers({
      'Authorization': localStorage['token'],
      'Content-Type': this.contentType_UrlEncoded,
    });

    // Add required parameters
    let requestParams = `newDescription=${description}`;

    // Send request
    return this._http.put(updateUrl, requestParams, { headers: headers })
      .toPromise()
      .then((response: Response) => { return response; })
      .catch(this.handleError)
  }

  delete(assignmentId: string): Promise<any> {
    // Create request information
    let deleteUrl = `${this.baseUrl}/users/${localStorage['currentUser']}/assignments/${assignmentId}`;
    let headers = new Headers({
      Authorization: localStorage['token'],
      'Content-Type': this.contentType_UrlEncoded,
    });

    // Send request
    return this._http.delete(deleteUrl, { headers: headers })
      .toPromise()
      .then((response: Response) => { return response; })
      .catch(this.handleError)
  }
}
