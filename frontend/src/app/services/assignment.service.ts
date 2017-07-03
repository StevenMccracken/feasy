import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';

import { LoginService } from '../services/login.service';

import { Assignment } from '../objects/assignment';

@Injectable()
export class AssignmentService {
    private apiUrl: string = 'http://localhost:8080';
    private headers: Headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });

    constructor(private http: Http, private loginService: LoginService) {
        this.headers.append('Authorization', this.loginService.token);
    }

    buildQueryString(obj: Object): string {
        let queryString: string = '';
        for (let key in obj) queryString += `${key}=${obj[key]}&`;

        // Remove the last & from the query string and return it
        return queryString.substring(0, queryString.length - 1);
    }

    createAssignment(username: string, assignmentInfo: Object): Promise<Assignment> {
        let url = `${this.apiUrl}/users/${username}/assignments`;
        let body = this.buildQueryString(assignmentInfo);
        return this.http
            .post(url, body, { headers: this.headers })
            .toPromise()
            .then((response) => {
                let body = response.json();
                return {
                    id: body._id,
                    title: body.title,
                    dueDate: new Date(body.dueDate),
                    completed: body.completed,
                    userId: body.userId,
                    dateCreated: new Date(body.dateCreated),
                    class: body.class,
                    type: body.type,
                    description: body.description
                };
            })
            .catch(this.handleError);
    }

    getAssignment(username: string, assignmentId: string): Promise<Assignment> {
        let url = `${this.apiUrl}/users/${username}/assignments/${assignmentId}`;
        return this.http
            .get(url, { headers: this.headers })
            .toPromise()
            .then((response) => {
                let body = response.json();
                let assignment = {
                    id: body._id,
                    title: body.title,
                    dueDate: new Date(body.dueDate),
                    completed: body.completed,
                    userId: '0',
                    dateCreated: new Date(body.dateCreated),
                    class: body.class,
                    type: body.type,
                    description: body.description
                };

                return assignment
            })
    }

    getAssignments(username: string): Promise<Assignment[]> {
        let url = `${this.apiUrl}/users/${username}/assignments`;
        return this.http
            .get(url, { headers: this.headers })
            .toPromise()
            .then((response) => {
                let body = response.json();

                let assignments = new Array<Assignment>();
                for (let id in body) {
                    let assignment = body[id];
                    assignments.push({
                        id: assignment._id,
                        title: assignment.title,
                        dueDate: new Date(assignment.dueDate),
                        completed: assignment.completed,
                        userId: '0',
                        dateCreated: new Date(assignment.dateCreated),
                        class: assignment.class,
                        type: assignment.type,
                        description: assignment.description
                    });
                }

                return assignments;
            })
            .catch(this.handleError);
    }

    updateDueDate(username: string, assignmentId: string, newDueDate: Date): Promise<string> {
        let url = `${this.apiUrl}/users/${username}/assignments/${assignmentId}/dueDate`;
        let body = this.buildQueryString({ newDueDate: Math.floor(newDueDate.getTime() / 1000) });
        return this.http
            .put(url, body, { headers: this.headers })
            .toPromise()
            .then(response => response.json().success.message)
            .catch(this.handleError);
    }

    deleteAssignment(username: string, assignmentId: string): Promise<string> {
        let url = `${this.apiUrl}/users/${username}/assignments/${assignmentId}`;
        return this.http
            .delete(url, { headers: this.headers })
            .toPromise()
            .then(response => response.json().success.message as string)
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        let body = error.json().error;
        return Promise.reject(body.message || body);
    }
}
