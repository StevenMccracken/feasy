import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import { Router } from '@angular/router';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Injectable, OnInit } from '@angular/core';

import { FeasyService } from './feasy.service';
import { Assignment } from '../objects/assignment';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

@Injectable()
export class AssignmentService {
  constructor(
    private _router: Router,
    private _feasyApi: FeasyService,
    private _utils: CommonUtilsService,
    private _storage: LocalStorageService
  ) {}

  /**
   * Sends a request to create MULTIPLE new assignment
   * @param {Assignment[]} _assignments the assignment object array
   * @return {Promise<Assignment>} the assignment object with extra information from the API
   */
  multipleCreate(_assignments: Assignment[]): Promise<Assignment[]>{
    let array: Assignment[] = [];
    console.log(_assignments);
    for(let assignment of _assignments){
      let temp = new Date();
      try{
        temp = new Date(assignment.dueDate.toString() + "T00:00:00");
      }catch(err){
        console.log(err);
        temp = new Date();
      }
      assignment.dueDate = new Date(temp);
      this.create(assignment)
          .then((res: Assignment) => {
            array.push(res);
          })
          .catch((err: any) => {
            console.log(err);
          })
    }
    return Promise.resolve(array);
  }
  /**
   * Sends a request to create a new assignment
   * @param {Assignment = new Assignment()} _assignment the assignment object
   * @return {Promise<Assignment>} the assignment object with extra information from the API
   */
  create(_assignment: Assignment = new Assignment()): Promise<Assignment> {

    console.log(_assignment);
    // Create request information
    let token: string = this._storage.getItem('token');
    let username: string = this._storage.getItem('currentUser');
    let createPath = `/users/${username}/assignments`;
    let headersOptions = { Authorization: token };

    // Check required assignment attributes
    let invalidParams: string[] = [];
    if (!this._utils.hasValue(_assignment.title)) invalidParams.push('title');
    if (!this._utils.hasValue(_assignment.dueDate)) _assignment.dueDate = new Date();

    // Reject if there are invalid required assignment parameters
    if (invalidParams.length > 0) return Promise.reject(invalidParams);

    // Add required assignment attributes
    let dateUnixSeconds = Math.round(_assignment.dueDate.getTime() / 1000);
    let requestParams = {
      title: _assignment.title,
      dueDate: dateUnixSeconds,
    };

    // Add optional assignment attributes
    if (this._utils.hasValue(_assignment.class)) requestParams['class'] = _assignment.class;
    if (this._utils.hasValue(_assignment.type)) requestParams['type'] = _assignment.type;
    if (this._utils.hasValue(_assignment.description)) {
      requestParams['description'] = _assignment.description;
    }

    if (this._utils.hasValue(_assignment.completed)) {
      requestParams['completed'] = _assignment.completed;
    }

    // Send request
    return this._feasyApi.post(createPath, requestParams, headersOptions)
      .then((successResponse: Response) => {
        let responseBody = successResponse.json();

        // Update attributes for the local object that were created by the API
        _assignment._id = responseBody['_id'];
        _assignment.type = responseBody.type;
        return Promise.resolve(_assignment);
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
   * @param {string} _id the id of the desired assignment
   * @return {Promise<Assignment>} the assignment object for the specified id
   */
  get(_id: string): Promise<Assignment> {
    // Create request information
    let token: string = this._storage.getItem('token');
    let username: string = this._storage.getItem('currentUser');
    let getPath = `/users/${username}/assignments/${_id}`;
    let headersOptions = { Authorization: token };

    // Send request
    return this._feasyApi.get(getPath, headersOptions)
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
    let token: string = this._storage.getItem('token');
    let username: string = this._storage.getItem('currentUser');
    let getPath = `/users/${username}/assignments`;
    let headersOptions = { Authorization: token };

    // Send request
    return this._feasyApi.get(getPath, headersOptions)
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
   * @param {string} _id the id of the desired assignment
   * @param {string} _attribute the name of the assignment attribute to update
   * @param {any} _newValue the new value for the assignment's attribute
   * @return {Promise<any>} the Response object from the API
   */
  private update(_id: string, _attribute: string, _newValue: any): Promise<any> {
    // Create request information
    let token = this._storage.getItem('token');
    let username = this._storage.getItem('currentUser');
    let updatePath = `/users/${username}/assignments/${_id}/${_attribute}`;
    let headersOptions = { Authorization: token };

    // Add required parameters
    let capitalizedAttribute = `${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;
    let requestParams = { [`new${capitalizedAttribute}`]: _newValue };

    // Send request
    return this._feasyApi.put(updatePath, requestParams, headersOptions)
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
          if (/[iI]nvalid/.test(errorMessage)) errorReason = 'invalid';
          else if (/[uU]nchanged/.test(errorMessage)) errorReason = 'unchanged';
          else errorReason = 'unknown';

          return Promise.reject(errorReason);
        } else return Promise.reject(updateError);
      });
  }

  /**
   * Sends a request to update an assignment's title
   * @param {string} _id the id of the desired assignment
   * @param {string} _newTitle the new title to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateTitle(_id: string, _newTitle: string): Promise<any> {
    return this.update(_id, 'title', _newTitle)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's due date
   * @param {string} _id the id of the desired assignment
   * @param {Date} _newDueDate the new due date to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateDueDate(_id: string, _newDueDate: Date): Promise<any> {
    let newDueDateUnixSeconds = Math.round(_newDueDate.getTime() / 1000);
    return this.update(_id, 'dueDate', newDueDateUnixSeconds)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's completed attribute
   * @param {string} _id the id of the desired assignment
   * @param {boolean} _newCompleted the new completed value to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateCompleted(_id: string, _newCompleted: boolean): Promise<any> {
    return this.update(_id, 'completed', _newCompleted)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's class
   * @param {string} _id the id of the desired assignment
   * @param {string} _newClass the new class value to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateClass(_id: string, _newClass: string): Promise<any> {
    return this.update(_id, 'class', _newClass)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's type
   * @param {string} _id the id of the desired assignment
   * @param {string} _newType the new type value to udpate the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateType(_id: string, _newType: string): Promise<any> {
    return this.update(_id, 'type', _newType)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to update an assignment's description
   * @param {string} _id the id of the desired assignment
   * @param {string} _newDescription the new description value to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateDescription(_id: string, _newDescription: string): Promise<any> {
    return this.update(_id, 'description', _newDescription)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: any) => Promise.reject(updateError));
  }

  /**
   * Sends a request to delete an assignment
   * @param {string} _id the id of the desired assignment
   * @return {Promise<any>} an empty resolved promise
   */
  delete(_id: string): Promise<any> {
    // Create request information
    let token = this._storage.getItem('token');
    let username = this._storage.getItem('currentUser');
    let deletePath = `/users/${username}/assignments/${_id}`;
    let headersOptions = { 'Authorization': token };

    // Send request
    return this._feasyApi.delete(deletePath, headersOptions)
      .then((successResponse: Response) => Promise.resolve())
      .catch((deleteError: any) => Promise.reject(deleteError));
  }
}
