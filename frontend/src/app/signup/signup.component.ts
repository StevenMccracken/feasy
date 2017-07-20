import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../objects/user';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  user: User = new User();
  passwordValidator: string;
  error: boolean = false;

  constructor(private _userService: UserService, private router: Router) {}

  ngOnInit() {}

  add(): void {
    if (!this.user) return null;
    this._userService.create(this.user)
      .then((response: User) => console.log(response));
  }
}
