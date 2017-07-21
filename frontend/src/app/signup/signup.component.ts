import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { User } from '../objects/user';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit {
  user = new User();
  passwordValidator: string;
  error = false;

  constructor(private _userService: UserService, private router: Router) {}

  ngOnInit() {}

  add(): void {
    if (!this.user) return null;
    this._userService.create(this.user)
      .then((response: User) => console.log(response));
  }
}
