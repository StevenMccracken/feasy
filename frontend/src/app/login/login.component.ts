import { Component, OnInit } from '@angular/core';
import { UserService }       from '../services/user.service';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  thisUsername: string;
  thisPassword: string;
  form:     FormGroup;
  token:    string;
  status:   any;

  constructor(private _userService: UserService, private _router:Router) {}

  ngOnInit() {
    if(!(localStorage['currentUser'] === undefined || localStorage['token'] === undefined)){
      console.log(localStorage.getItem('currentUser'));
      this._router.navigate(['main']);
    }
  }

  validate() {
    console.log("validating");
    this._userService.validate(this.thisUsername, this.thisPassword)
                     .then(()=> {this._router.navigate(['main'])});
  }
}
