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

  private userUrl = 'https://api.pyrsuit.com';
  private token = '';

  private headers = new Headers({"Content-Type": "application/x-www-form-urlencoded"});

  constructor(private _http: Http, private _router: Router) { }

  private handleError(error: any): Promise<any>{
    console.log("http error:", error);
    if(error.status == 401){
      localStorage.clear();
      this._router.navigate(['/login']);
    }
    return Promise.reject(error.message || error);
  }

  get(): Promise<Account>{
    let extension = this.userUrl + "/users/" + localStorage['currentUser'];
    let headers: Headers = new Headers({"Authorization":localStorage['token'], "Content-Type":"application/x-www-form-urlencoded"});
    return this._http.get(extension, {headers: headers})
                     .toPromise()
                     .then((res: Response)=> {
                       console.log(res);
                       let account:Account = res.json();
                       return account})
                     .catch((error:any) => this.handleError(error));
  }

  create(user: User): Promise<User>{
    //used for api extention
    let extension = this.userUrl + "/users";

    //used for body data
    let body = "username="+user.username+
               "&password="+user.password+
               "&email="+user.email+
               "&firstName="+user.firstName+
               "&lastName="+user.lastName;

    return this._http.post(extension.toString(), body, {headers: this.headers})
                     .toPromise()
                     .then((response: Response) =>{
                       let body = response.json();
                       return body.data || {};
                     })
                     .catch(this.handleError);
  }

  validate(username: string, password: string): Promise<string>{
    let extention = this.userUrl+"/login";

    let body = "username="+username+
               "&password="+password;

    return this._http.post(extention.toString(), body, {headers: this.headers})
                     .toPromise()
                     .then((response: Response) => {
                       let token = response.json().success.token;
                       localStorage.setItem('currentUser', username);
                       localStorage.setItem('token', token);
                     })
                      .catch(this.handleError);
  }
}
