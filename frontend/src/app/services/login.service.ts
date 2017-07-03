import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class LoginService {
    public token: string;
    private apiUrl: string = 'http://localhost:8080';

    constructor(private http: Http) {
        // Set token if saved in local storage
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.token = currentUser && currentUser.token;
    }

    login(username: string, password: string): Promise<boolean> {
        let url = `${this.apiUrl}/login`;
        let body = `username=${username}&password=${password}`;
        let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });

        return this.http
            .post(url, body, { headers: headers })
            .toPromise()
            .then((response) => {
                let body = response.json();
                let token = body && body.success.token;
                if (token) {
                    this.token = token;
                    localStorage.setItem(
                        'currentUser',
                        JSON.stringify({ username: username, token: token })
                    );

                    return true;
                } else return false;
            })
            .catch(this.handleError);
    }

    // Clear token remove user from local storage to log user out
    logout(): void {
        this.token = null;
        localStorage.removeItem('currentUser');
    }

    private handleError(error: any): Promise<any> {
        let body = error.json().error;
        return Promise.reject(body.message || body);
    }
}
