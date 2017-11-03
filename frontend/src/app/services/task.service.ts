// Import angular packages
import { Router } from '@angular/router';
import { Response } from '@angular/http';
import { Injectable } from '@angular/core';

// Import our files
import { Task } from '../objects/task';
import { FeasyService } from './feasy.service';
import { ErrorService } from './error.service';
import { LocalError } from '../objects/local-error';
import { RemoteError } from '../objects/remote-error';
import { CommonUtilsService } from '../utils/common-utils.service';
import { LocalStorageService } from '../utils/local-storage.service';

@Injectable()
export class TaskService {
  constructor(
    private ROUTER: Router,
    private ERROR: ErrorService,
    private FEASY_API: FeasyService,
    private UTILS: CommonUtilsService,
    private STORAGE: LocalStorageService,
  ) {}

  /**
   * Sends a request to create a new task
   * @param {Task} [_task = new Task()] the task object
   * @return {Promise<Task>} the task object with extra information from the API
   */
  create(_task: Task = new Task()): Promise<Task> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const createPath: string = `/users/${username}/assignments`;
    const headersOptions: Object = { Authorization: token };

    // Check required task attributes
    const invalidParams: string[] = [];
    if (!this.UTILS.hasValue(_task.title)) invalidParams.push('title');
    if (!this.UTILS.hasValue(_task.dueDate)) invalidParams.push('dueDate');

    // Reject if there are invalid required task parameters
    if (invalidParams.length > 0) {
      const localError: LocalError = new LocalError('task.service.create')
      localError.setCustomProperty('invalidParameters', invalidParams);
      return Promise.reject(localError);
    } else {
      // Add required task attributes
      const dateUnixSeconds: number = _task.getDueDateInUnixSeconds();
      const requestParams: Object = {
        title: _task.title,
        dueDate: dateUnixSeconds,
      };

      // Add optional task attributes
      if (this.UTILS.hasValue(_task.class)) requestParams['class'] = _task.class;
      if (this.UTILS.hasValue(_task.type)) requestParams['type'] = _task.type;
      if (this.UTILS.hasValue(_task.description)) requestParams['description'] = _task.description;
      if (this.UTILS.hasValue(_task.completed)) requestParams['completed'] = _task.completed;

      // Send request
      const promise = this.FEASY_API.post(createPath, requestParams, headersOptions)
        .then((successResponse: Response) => {
          const responseBody = successResponse.json();

          // Update attributes for the local object that were created by the API
          _task._id = responseBody['_id'];
          _task.type = responseBody.type;
          return Promise.resolve(_task);
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
   * Sends a request to create multiple new tasks
   * @param {Task[]} [_tasks = []] the array of task objects
   * @return {Promise<Task[]>} the task array objects with extra information added from the API
   */
  bulkCreate(_tasks: Task[] = []): Promise<Task[]> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const createPath: string = `/users/${username}/assignments`;
    const headersOptions: Object = { Authorization: token };

    // Check required task attributes
    const invalidTasks: Object = {};
    const formattedTasks: Object[] = [];
    for (let i = 0; i < _tasks.length; i++) {
      const invalidParams = [];
      if (!this.UTILS.hasValue(_tasks[i].title)) invalidParams.push('title');
      if (!this.UTILS.hasValue(_tasks[i].dueDate)) invalidParams.push('dueDate');

      if (invalidParams.length > 0) invalidTasks[String(i)] = invalidParams;
      else {
        // Add required task attributes
        const dateUnixSeconds: Number = Math.round(_tasks[i].dueDate.getTime() / 1000);
        const taskAttributes: Object = {
          title: _tasks[i].title,
          dueDate: dateUnixSeconds,
        };

        // Add optional task attributes
        if (this.UTILS.hasValue(_tasks[i].class)) taskAttributes['class'] = _tasks[i].class;
        if (this.UTILS.hasValue(_tasks[i].type)) taskAttributes['type'] = _tasks[i].type;
        if (this.UTILS.hasValue(_tasks[i].description)) taskAttributes['description'] = _tasks[i].description;
        if (this.UTILS.hasValue(_tasks[i].completed)) taskAttributes['completed'] = _tasks[i].completed;

        formattedTasks.push(taskAttributes);
      }
    }

    if (!this.UTILS.isJsonEmpty(invalidTasks)) {
      const localError: LocalError = new LocalError('task.service.bulkCreate')
      localError.setCustomProperty('invalidTasks', invalidTasks);
      return Promise.reject(localError);
    } else {
      // Create request parameters from task array
      const requestParams: Object = { assignments: formattedTasks.map(this.UTILS.stringify) };

      // Send request
      const promise = this.FEASY_API.post(createPath, requestParams, headersOptions)
        .then((successResponse: Response) => {
          const apiTasks = successResponse.json();

          // Process tasks JSON to Task objects array
          const tasks: Task[] = apiTasks.map(this.convertTaskJson);
          return Promise.resolve(tasks);
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
   * Sends a request to retrieve a specific task
   * @param {string} _id the id of the desired task
   * @return {Promise<Task>} the task object for the specified id
   */
  get(_id: string): Promise<Task> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const getPath: string = `/users/${username}/assignments/${_id}`;
    const headersOptions: Object = { Authorization: token };

    // Send request
    const promise = this.FEASY_API.get(getPath, headersOptions)
      .then((successResponse: Response) => {
        const responseBody = successResponse.json();

        // Process response JSON to Task object
        const task = new Task().deserialize(responseBody);
        return Promise.resolve(task);
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
   * Sends a request to retrieve all the tasks for the current user
   * @return {Promise<Task[]>} an array of all the current user's tasks
   */
  getAll(): Promise<Task[]> {
    // Create request information
    const token: string = this.STORAGE.getItem('token');
    const username: string = this.STORAGE.getItem('currentUser');
    const getPath: string = `/users/${username}/assignments`;
    const headersOptions: Object = { Authorization: token };

    // Send request
    const promise = this.FEASY_API.get(getPath, headersOptions)
      .then((successResponse: Response) => {
        const apiTasks = successResponse.json();

        // Process tasks JSON to Task objects array
        const tasks: Task[] = apiTasks.map(this.convertTaskJson);
        return Promise.resolve(tasks);
      }) // End then(successResponse)
      .catch((errorResponse: Response) => {
        const error: RemoteError = this.ERROR.getRemoteError(errorResponse);
        if (this.ERROR.isInvalidRequestError(error)) error.setCustomProperty('invalidParameter', 'username');

        return Promise.reject(error);
      }); // End this.FEASY_API.get()

    return promise;
  } // End getAll()

  /**
   * Sends a request to update an attribute for a specific task
   * @param {string} _id the id of the desired task
   * @param {string} _attribute the name of the task attribute to update
   * @param {any} _newValue the new value for the task's attribute
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
   * Sends a request to update a task's title
   * @param {string} _id the id of the desired task
   * @param {string} _newTitle the new title to update the task with
   * @return {Promise<any>} an empty resolved promise
   */
  updateTitle(_id: string, _newTitle: string): Promise<any> {
    const promise = this.update(_id, 'title', _newTitle)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateTitle()

  /**
   * Sends a request to update a task's due date
   * @param {string} _id the id of the desired task
   * @param {Date} _newDueDate the new due date to update the task with
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
   * Sends a request to update a task's completed attribute
   * @param {string} _id the id of the desired task
   * @param {boolean} _newCompleted the new completed value to update the task with
   * @return {Promise<any>} an empty resolved promise
   */
  updateCompleted(_id: string, _newCompleted: boolean): Promise<any> {
    const promise = this.update(_id, 'completed', _newCompleted)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateCompleted()

  /**
   * Sends a request to update a task's class
   * @param {string} _id the id of the desired task
   * @param {string} _newClass the new class value to update the task with
   * @return {Promise<any>} an empty resolved promise
   */
  updateClass(_id: string, _newClass: string): Promise<any> {
    const promise = this.update(_id, 'class', _newClass)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateClass()

  /**
   * Sends a request to update a task's type
   * @param {string} _id the id of the desired task
   * @param {string} _newType the new type value to udpate the task with
   * @return {Promise<any>} an empty resolved promise
   */
  updateType(_id: string, _newType: string): Promise<any> {
    const promise = this.update(_id, 'type', _newType)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateType()

  /**
   * Sends a request to update a task's description
   * @param {string} _id the id of the desired task
   * @param {string} _newDescription the new description value to update the task with
   * @return {Promise<any>} an empty resolved promise
   */
  updateDescription(_id: string, _newDescription: string): Promise<any> {
    const promise = this.update(_id, 'description', _newDescription)
      .then((successResponse: Response) => Promise.resolve())
      .catch((updateError: RemoteError) => Promise.reject(updateError));

    return promise;
  } // End updateDescription()

  /**
   * Sends a request to delete a task
   * @param {string} _id the id of the desired task
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
        if (this.ERROR.isInvalidRequestError(error)) error.setCustomProperty('invalidParameter', 'taskId');

        return Promise.reject(error);
      });

    return promise;
  } // End delete()

  /**
   * Converts a task from the API to a local Task object
   * @param {Object} [_taskJson = {}] [description]
   * @return {Task} the task object containing information from the JSON
   */
  convertTaskJson(_taskJson: Object = {}): Task {
    const task = new Task().deserialize(_taskJson);
    return task;
  } // End convertTaskJson()

  /**
   * Sorts a given array of tasks in ascending order based on their due date
   * @param {Task[]} [_tasks = []] the tasks to sort
   */
  sort(_tasks: Task[] = []): void {
    _tasks.sort((a, b) => a.getDueDateInUnixMilliseconds() - b.getDueDateInUnixMilliseconds());
  } // End sort()
}
