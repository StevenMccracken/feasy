import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Injectable, OnInit} from '@angular/core';
import { Headers, Http, RequestOptions, Response } from '@angular/http';

import { Assignment } from '../objects/Assignment';

@Injectable()
export class AssignmentService {
  private baseUrl = 'https://api.feasy-app.com';
  private contentType_UrlEncoded = 'application/x-www-form-urlencoded';
  private standardHeaders = new Headers({ 'Content-Type': this.contentType_UrlEncoded });

  constructor(private _http: Http, private _router: Router) {}

  /**
   * Sends a request to create a new assignment
   * @param {Assignment} assignment the assignment object
   * @return {Promise<Assignment>} the assignment object with extra information from the API
   */
  create(assignment: Assignment): Promise<Assignment> {
    // Create request information
    let token: string = localStorage.getItem('token');
    let username: string = localStorage.getItem('currentUser');

    let createUrl = `${this.baseUrl}/users/${username}/assignments`;
    let headers = new Headers({
      Authorization: token,
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
      .then((successResponse: Response) => {
        let responseBody = successResponse.json();

        // Update attributes for the local object that were created by the API
        assignment._id = responseBody['_id'];
        assignment.type = responseBody.type;
        return Promise.resolve(assignment);
      })
      .catch((errorResponse: Response) => {
        /*
         * Return detailed errors for invalid request error or
         * resource errors. Otherwise, return the response object
         */
        if (errorResponse.status == 400) {
          let responseBody = errorResponse.json();
          let errorMessage: string = (responseBody &&
            responseBody.error &&
            responseBody.error.message) ||
            '';

          // The request contains invalid/malformed parameters from the assignment's attributes
          let commaSeparatedParams: string = errorMessage.split('Invalid parameters: ')[1];

          // Comma separated params should be something like title,dueDate
          let invalidParameters = commaSeparatedParams.split(',');
          return Promise.reject(invalidParameters);
        } else return Promise.reject(errorResponse);
      });
  }

  /**
   * Sends a request to retrieve a specific assignment
   * @param {string} id the id of the desired assignment
   * @return {Promise<Assignment>} the assignment object for the specified id
   */
  get(id: string): Promise<Assignment> {
    // Create request information
    let token: string = localStorage.getItem('token');
    let username: string = localStorage.getItem('currentUser');

    let getUrl = `${this.baseUrl}/users/${username}/assignments/${id}`;
    let headers = new Headers({
      Authorization: token,
      'Content-Type': this.contentType_UrlEncoded,
    });

    // Send request
    return this._http.get(getUrl, { headers: headers })
      .toPromise()
      .then((successResponse: Response) => {
        let responseBody = successResponse.json();

        // Process response JSON to Assignment object
        let assignment = new Assignment().deserialize(responseBody);
        return Promise.resolve(assignment);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Sends a request to retrieve all the assignments for the current user
   * @return {Promise<Assignment[]>} an array of all the current user's assignments
   */
  getAll(): Promise<Assignment[]> {
    // Create request information
    let token: string = localStorage.getItem('token');
    let username: string = localStorage.getItem('currentUser');

    let getUrl = `${this.baseUrl}/users/${username}/assignments`;
    let headers = new Headers({
      Authorization: token,
      'Content-Type': this.contentType_UrlEncoded,
    });

    // Send request
    return this._http.get(getUrl, { headers: headers })
      .toPromise()
      .then((successResponse: Response) => {
        let assignmentJson = successResponse.json();

        // Process assignments JSON to Assignment objects array
        let assignments: Assignment[] = [];
        for (let assignmentId in assignmentJson) {
          let assignment = new Assignment().deserialize(assignmentJson[assignmentId])
          assignments.push(assignment);
        }

        return Promise.resolve(assignments);
      })
      .catch((errorResponse: Response) => Promise.reject(errorResponse));
  }

  /**
   * Sends a request to update an attribute for a specific assignment
   * @param {string} id the id of the desired assignment
   * @param {string} attribute the name of the assignment attribute to update
   * @param {any} newValue the new value for the assignment's attribute
   * @return {Promise<any>} the Response object from the API
   */
  private update(id: string, attribute: string, newValue: any): Promise<any> {
    // Create request information
    let token = localStorage.getItem('token');
    let username = localStorage.getItem('currentUser');
    let updateUrl = `${this.baseUrl}/users/${username}/assignments/${id}/${attribute}`;
    let headers = new Headers({
      'Authorization': token,
      'Content-Type': this.contentType_UrlEncoded,
    });

    // Add required parameters
    let capitalizedAttribute = `${attribute.charAt(0).toUpperCase()}${attribute.slice(1)}`
    let requestParams = `new${capitalizedAttribute}=${newValue}`;

    // Send request
    return this._http.put(updateUrl, requestParams, { headers: headers })
      .toPromise()
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((updateError: Response) => {
        // Return detailed errors for invalid request error. Otherwise, return the response object
        if (updateError.status == 400) {
          let responseBody = updateError.json();
          let errorMessage: string = (responseBody &&
            responseBody.error &&
            responseBody.error.message) ||
            '';

          // The request contains invalid/malformed parameters from the assignment's attributes
          let errorReason;
          if (errorMessage.indexOf('Invalid') != -1) errorReason = 'invalid';
          else if (errorMessage.indexOf('Unchanged') != -1) errorReason = 'unchanged';
          else errorReason = 'unknown';

          return Promise.reject(errorReason);
        } else return Promise.reject(updateError);
      });
  }

  /**
   * Sends a request to update an assignment's title
   * @param {string} id the id of the desired assignment
   * @param {string} newTitle the new title to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateTitle(id: string, newTitle: string): Promise<any> {
    return this.update(id, 'title', newTitle)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's due date
   * @param {string} id the id of the desired assignment
   * @param {Date} newDueDate the new due date to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateDueDate(id: string, newDueDate: Date): Promise<any> {
    let newDueDateUnixSeconds = newDueDate.getTime() / 1000;
    return this.update(id, 'dueDate', newDueDateUnixSeconds)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's completed attribute
   * @param {string} id the id of the desired assignment
   * @param {boolean} newCompleted the new completed value to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateCompleted(id: string, newCompleted: boolean): Promise<any> {
    return this.update(id, 'completed', newCompleted)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's class
   * @param {string} id the id of the desired assignment
   * @param {string} newClass the new class value to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateClass(id: string, newClass: string): Promise<any> {
    return this.update(id, 'class', newClass)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's type
   * @param {string} id the id of the desired assignment
   * @param {string} newType the new type value to udpate the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateType(id: string, newType: string): Promise<any> {
    return this.update(id, 'type', newType)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's description
   * @param {string} id the id of the desired assignment
   * @param {string} newDescription the new description value to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateDescription(id: string, newDescription: string): Promise<any> {
    return this.update(id, 'description', newDescription)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to delete an assignment
   * @param {string} id the id of the desired assignment
   * @return {Promise<any>} an empty resolved promise
   */
  delete(id: string): Promise<any> {
    // Create request information
    let token = localStorage.getItem('token');
    let username = localStorage.getItem('currentUser');
    let deleteUrl = `${this.baseUrl}/users/${username}/assignments/${id}`;
    let headers = new Headers({
      'Authorization': token,
      'Content-Type': this.contentType_UrlEncoded,
    });

    // Send request
    return this._http.delete(deleteUrl, { headers: headers })
      .toPromise()
      .then((successResponse: Response) => Promise.resolve())
      .catch((deleteError: Response) => Promise.reject(deleteError));
  }

  /**
   * Determines if a specific local storage item contains any meaningful data
   * @param {string} storageItemKey the key of the local storage item
   * @return {boolean} whether or not the key contains a meaningful (non-empty) data value
   */
  isValidStorageItem(storageItemKey: string): boolean {
    let storageItem = localStorage.getItem(storageItemKey);
    return storageItem != null && storageItem != undefined && storageItem != '';
  }
}
