import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';

import { LoginService } from '../services/login.service';

import { User } from '../objects/user';

@Injectable()
export class UserService {
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

    createUser(userInfo: Object): Promise<User> {
        let url = `${this.apiUrl}/users`;
        let body = this.buildQueryString(userInfo);
        return this.http
            .post(url, body, { headers: this.headers })
            .toPromise()
            .then((response) => {
                let body = response.json();
                return {
                    id: body._id,
                    username: body.username,
                    email: body.email,
                    firstName: body.firstName,
                    lastName: body.lastName,
                    password: userInfo['password'],
                };
            })
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        let body = error.json().error;
        return Promise.reject(body.message || body);
    }
}
