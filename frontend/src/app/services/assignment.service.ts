// Import angular packages
import {
  OnInit,
  Injectable,
} from '@angular/core';
import { Router } from '@angular/router';
import { Response } from '@angular/http';

// Import 3rd-party libraries
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';

// Import our files
import { FeasyService } from './feasy.service';
import { ErrorService } from './error.service';
import { Assignment } from '../objects/assignment';
import { LocalError } from '../objects/local-error';
import { RemoteError } from '../objects/remote-error';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

@Injectable()
export class AssignmentService {
  constructor(
    private ROUTER: Router,
    private ERROR: ErrorService,
    private FEASY_API: FeasyService,
    private UTILS: CommonUtilsService,
    private STORAGE: LocalStorageService,
  ) {}

  /**
   * Sends a request to create a new assignment
   * @param {Assignment} [_assignment = new Assignment()] the assignment object
   * @return {Promise<Assignment>} the assignment object with extra information from the API
   */
  create(_assignment: Assignment = new Assignment()): Promise<Assignment> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const createPath: string = `/users/${username}/assignments`;
    const headersOptions: Object = { Authorization: token };

    // Check required assignment attributes
    const invalidParams: string[] = [];
    if (!this.UTILS.hasValue(_assignment.title)) invalidParams.push('title');
    if (!this.UTILS.hasValue(_assignment.dueDate)) invalidParams.push('dueDate');

    // Reject if there are invalid required assignment parameters
    if (invalidParams.length > 0) {
      const localError: LocalError = new LocalError('assignment.service.create')
      localError.setCustomProperty('invalidParameters', invalidParams);
      return Promise.reject(localError);
    } else {
      // Add required assignment attributes
      const dateUnixSeconds: number = _assignment.getDueDateInUnixSeconds();
      const requestParams: Object = {
        title: _assignment.title,
        dueDate: dateUnixSeconds,
      };

      // Add optional assignment attributes
      if (this.UTILS.hasValue(_assignment.class)) requestParams['class'] = _assignment.class;
      if (this.UTILS.hasValue(_assignment.type)) requestParams['type'] = _assignment.type;
      if (this.UTILS.hasValue(_assignment.description)) requestParams['description'] = _assignment.description;
      if (this.UTILS.hasValue(_assignment.completed)) requestParams['completed'] = _assignment.completed;

      // Send request
      const promise = this.FEASY_API.post(createPath, requestParams, headersOptions)
        .then((successResponse: Response) => {
          const responseBody = successResponse.json();

          // Update attributes for the local object that were created by the API
          _assignment._id = responseBody['_id'];
          _assignment.type = responseBody.type;
          return Promise.resolve(_assignment);
        }) // End then(successResponse)
        .catch((errorResponse: Response) => {
          if (errorResponse instanceof Response) {
            const error: RemoteError = this.ERROR.getRemoteError(errorResponse);

            if (this.ERROR.isInvalidRequestError(error)) {
              const invalidParameters: string[] = this.ERROR.getInvalidParameters(error);
              error.setCustomProperty('invalidParameters', invalidParameters);
            }

            return Promise.reject(error);
          } else return Promise.reject(errorResponse);
        }); // End this.FEASY_API.post()

      return promise;
    }
  } // End create()

  /**
   * Sends a request to create multiple new assignments
   * @param {Assignment[]} [_assignments = []] the array of assignment objects
   * @return {Promise<Assignment[]>} the assignment array objects with extra information added from the API
   */
  bulkCreate(_assignments: Assignment[] = []): Promise<Assignment[]> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const createPath: string = `/users/${username}/assignments`;
    const headersOptions: Object = { Authorization: token };

    // Check required assignment attributes
    const invalidAssignments: Object = {};
    const formattedAssignments: Object[] = [];
    for (let i = 0; i < _assignments.length; i++) {
      const invalidParams = [];
      if (!this.UTILS.hasValue(_assignments[i].title)) invalidParams.push('title');
      if (!this.UTILS.hasValue(_assignments[i].dueDate)) invalidParams.push('dueDate');

      if (invalidParams.length > 0) invalidAssignments[String(i)] = invalidParams;
      else {
        // Add required assignment attributes
        const dateUnixSeconds: Number = Math.round(_assignments[i].dueDate.getTime() / 1000);
        const assignmentAttributes: Object = {
          title: _assignments[i].title,
          dueDate: dateUnixSeconds,
        };

        // Add optional assignment attributes
        if (this.UTILS.hasValue(_assignments[i].class)) assignmentAttributes['class'] = _assignments[i].class;
        if (this.UTILS.hasValue(_assignments[i].type)) assignmentAttributes['type'] = _assignments[i].type;
        if (this.UTILS.hasValue(_assignments[i].description)) assignmentAttributes['description'] = _assignments[i].description;
        if (this.UTILS.hasValue(_assignments[i].completed)) assignmentAttributes['completed'] = _assignments[i].completed;

        formattedAssignments.push(assignmentAttributes);
      }
    }

    if (!this.UTILS.isJsonEmpty(invalidAssignments)) {
      const localError: LocalError = new LocalError('assignment.service.bulkCreate')
      localError.setCustomProperty('invalidAssignments', invalidAssignments);
      return Promise.reject(localError);
    } else {
      // Create request parameters from assignment array
      const requestParams: Object = { assignments: formattedAssignments.map(this.UTILS.stringify) };

      // Send request
      const promise = this.FEASY_API.post(createPath, requestParams, headersOptions)
        .then((successResponse: Response) => {
          const apiAssignments = successResponse.json();

          // Process assignments JSON to Assignment objects array
          const assignments: Assignment[] = apiAssignments.map(this.convertAssignmentJson);
          return Promise.resolve(assignments);
        })
        .catch((errorResponse: Response) => {
          const error: RemoteError = this.ERROR.getRemoteError(errorResponse);

          if (this.ERROR.isInvalidRequestError(error)) {
            const invalidParameters: string[] = this.ERROR.getInvalidParameters(error);
            error.setCustomProperty('invalidParameters', invalidParameters);
          }

          return Promise.reject(error);
        }); // End this.FEASY_API.post()

      return promise;
    }
  } // End bulkCreate()

  /**
   * Sends a request to retrieve a specific assignment
   * @param {string} _id the id of the desired assignment
   * @return {Promise<Assignment>} the assignment object for the specified id
   */
  get(_id: string): Promise<Assignment> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const getPath: string = `/users/${username}/assignments/${_id}`;
    const headersOptions: Object = { Authorization: token };

    // Send request
    const promise = this.FEASY_API.get(getPath, headersOptions)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();

        // Process response JSON to Assignment object
        const assignment = new Assignment().deserialize(responseBody);
        return Promise.resolve(assignment);
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        const error: RemoteError = this.ERROR.getRemoteError(errorResponse);

        if (this.ERROR.isInvalidRequestError(error)) {
          const invalidParameters: string[] = this.ERROR.getInvalidParameters(error);
          error.setCustomProperty('invalidParameters', invalidParameters);
        }

        return Promise.reject(error);
      }); // End this.FEASY_API.get()

    return promise;
  } // End get()

  /**
   * Sends a request to retrieve all the assignments for the current user
   * @return {Promise<Assignment[]>} an array of all the current user's assignments
   */
  getAll(): Promise<Assignment[]> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const getPath: string = `/users/${username}/assignments`;
    const headersOptions: Object = { Authorization: token };

    // Send request
    const promise = this.FEASY_API.get(getPath, headersOptions)
      .then((successResponse: Response) => {
        const apiAssignments = successResponse.json();

        // Process assignments JSON to Assignment objects array
        const assignments: Assignment[] = apiAssignments.map(this.convertAssignmentJson);
        return Promise.resolve(assignments);
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        const error: RemoteError = this.ERROR.getRemoteError(errorResponse);
        if (this.ERROR.isInvalidRequestError(error)) error.setCustomProperty('invalidParameter', 'username');

        return Promise.reject(error);
      }); // End this.FEASY_API.get()

    return promise;
  } // End getAll()

  /**
   * Sends a request to update an attribute for a specific assignment
   * @param {string} _id the id of the desired assignment
   * @param {string} _attribute the name of the assignment attribute to update
   * @param {any} _newValue the new value for the assignment's attribute
   * @return {Promise<any>} the Response object from the API
   */
  private update(_id: string, _attribute: string, _newValue: any): Promise<any> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const updatePath: string = `/users/${username}/assignments/${_id}/${_attribute}`;
    const headersOptions: Object = { Authorization: token };

    // Add required parameters
    const capitalizedAttribute = `${_attribute.charAt(0).toUpperCase()}${_attribute.slice(1)}`;
    const requestParams = { [`new${capitalizedAttribute}`]: _newValue };

    // Send request
    const promise = this.FEASY_API.put(updatePath, requestParams, headersOptions)
      .then((successResponse: Response) => Promise.resolve(successResponse))
      .catch((updateError: Response) => {
        const error: RemoteError = this.ERROR.getRemoteError(updateError);
        if (this.ERROR.isInvalidRequestError(error)) {
          let invalidParameters: string[] = this.ERROR.getInvalidParameters(error);
          if (invalidParameters.length > 0) error.setCustomProperty('invalidParameters', invalidParameters);
          else {
            invalidParameters = this.ERROR.getUnchangedParameters(error);
            if (invalidParameters.length > 0) error.setCustomProperty('unchangedParameters', invalidParameters);
          }
        }

        return Promise.reject(error);
      }); // End this.FEASY_API.put()

    return promise;
  } // End update()

  /**
   * Sends a request to update an assignment's title
   * @param {string} _id the id of the desired assignment
   * @param {string} _newTitle the new title to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateTitle(_id: string, _newTitle: string): Promise<any> {
    const promise = this.update(_id, 'title', _newTitle)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateTitle()

  /**
   * Sends a request to update an assignment's due date
   * @param {string} _id the id of the desired assignment
   * @param {Date} _newDueDate the new due date to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateDueDate(_id: string, _newDueDate: Date): Promise<any> {
    const newDueDateUnixSeconds = Math.round(_newDueDate.getTime() / 1000);
    const promise = this.update(_id, 'dueDate', newDueDateUnixSeconds)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateDueDate()

  /**
   * Sends a request to update an assignment's completed attribute
   * @param {string} _id the id of the desired assignment
   * @param {boolean} _newCompleted the new completed value to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateCompleted(_id: string, _newCompleted: boolean): Promise<any> {
    const promise = this.update(_id, 'completed', _newCompleted)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateCompleted()

  /**
   * Sends a request to update an assignment's class
   * @param {string} _id the id of the desired assignment
   * @param {string} _newClass the new class value to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateClass(_id: string, _newClass: string): Promise<any> {
    const promise = this.update(_id, 'class', _newClass)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateClass()

  /**
   * Sends a request to update an assignment's type
   * @param {string} _id the id of the desired assignment
   * @param {string} _newType the new type value to udpate the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateType(_id: string, _newType: string): Promise<any> {
    const promise = this.update(_id, 'type', _newType)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateType()

  /**
   * Sends a request to update an assignment's description
   * @param {string} _id the id of the desired assignment
   * @param {string} _newDescription the new description value to update the assignment with
   * @return {Promise<any>} an empty resolved promise
   */
  updateDescription(_id: string, _newDescription: string): Promise<any> {
    const promise = this.update(_id, 'description', _newDescription)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateDescription()

  /**
   * Sends a request to delete an assignment
   * @param {string} _id the id of the desired assignment
   * @return {Promise<any>} an empty resolved promise
   */
  delete(_id: string): Promise<any> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const deletePath: string = `/users/${username}/assignments/${_id}`;
    const headersOptions: Object = { Authorization: token };

    // Send request
    const promise = this.FEASY_API.delete(deletePath, headersOptions)
      .then((successResponse: Response) => Promise.resolve())
      .catch((deleteError: Response) => {
        const error: RemoteError = this.ERROR.getRemoteError(deleteError);
        if (this.ERROR.isInvalidRequestError(error)) error.setCustomProperty('invalidParameter', 'assignmentId');

        return Promise.reject(error);
      });

    return promise;
  } // End delete()

  /**
   * Converts an assignment from the API to a local Assignment object
   * @param {Object} [_assignmentJson = {}] [description]
   * @return {Assignment} the assignment object containing information from the JSON
   */
  convertAssignmentJson(_assignmentJson: Object = {}): Assignment {
    const assignment = new Assignment().deserialize(_assignmentJson);
    return assignment;
  } // End convertAssignmentJson()

  /**
   * Sorts a given array of assignments in ascending order based on their due date
   * @param {Assignment[]} [_assignments = []] the assignments to sort
   */
  sort(_assignments: Assignment[] = []): void {
    _assignments.sort((a, b) => a.getDueDateInUnixMilliseconds() - b.getDueDateInUnixMilliseconds());
  } // End sort()
}
