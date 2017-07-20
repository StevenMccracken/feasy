import { Injectable, OnInit} from '@angular/core';

import { Headers, Http, RequestOptions, Response } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { Assignment } from '../objects/assignment';

import {Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

import { Router } from '@angular/router';


@Injectable()
export class AssignmentService implements OnInit{

  private apiUrl = 'https://api.feasy-app.com';
  private token: string;
  username: string;


  constructor(private _http: Http, private _router: Router) { }

  ngOnInit(){
    this.token = localStorage.getItem('token');
    this.username = localStorage.getItem('currentUser');
  }

  private handleError(error: any): Promise<any>{
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }


  get(): Promise<Assignment[]>{
    console.log(localStorage['token']);
    let extension = this.apiUrl + "/users/" + localStorage['currentUser'] +"/assignments";
    let headers: Headers = new Headers({"Authorization":localStorage['token'], "Content-Type":"application/x-www-form-urlencoded"});
    console.log(headers);
    return this._http.get(extension, {headers: headers})
                     .toPromise()
                     .then((response: Response) => {
                       let assignments: Assignment[] = [];
                       let data = response.json();
                       for(let i in data){
                          assignments.push(data[i]);
                        }
                       return assignments;
                     })
                     .catch(this.handleError);

  }


  delete(index: string): Promise<any>{
    let extension = this.apiUrl + "/users/" + localStorage['currentUser'] + "/assignments/" + index;
    let headers: Headers = new Headers({"Authorization":localStorage['token'], "Content-Type":"application/x-www-form-urlencoded"});
    console.log(headers);
    return this._http.delete(extension, {headers: headers})
                     .toPromise()
                     .then((res) => {return res;})
                     .catch(this.handleError)
  }


  create(assignment: Assignment): Promise<any>{
    let extension = this.apiUrl + "/users/" + localStorage['currentUser'] + "/assignments";
    let headers: Headers = new Headers({"Authorization":localStorage['token'], "Content-Type":"application/x-www-form-urlencoded"});
    console.log(headers);
    let body = "title="+assignment.title+
               "&dueDate="+assignment.dueDate.getTime() / 1000+
               "&completed="+assignment.completed+
               "&userId="+this.username;

    if(assignment.class !== undefined && assignment.class !== '')
      body = body + "&class="+assignment.class;
    if(assignment.type !== '' && assignment.type !== undefined)
      body = body + "&type="+assignment.type;
    if(assignment.description !== '' && assignment.description !== undefined)
      body = body+"&description="+assignment.description;

    return this._http.post(extension, body, {headers: headers})
                   .toPromise()
                   .then((res)=> {return res;})
                   .catch(this.handleError)
  }

  update(index: string, description: string): Promise<any>{
    let extension = this.apiUrl + "/users/" + localStorage['currentUser'] + "/assignments/" + index +"/description";
    let headers: Headers = new Headers({"Authorization":localStorage['token'], "Content-Type":"application/x-www-form-urlencoded"});
    let body: string = "newDescription="+description;
    return this._http.put(extension, body, {headers: headers})
                     .toPromise()
                     .then((res) => console.log(res))
                     .catch(this.handleError);

  }


}
