import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { Account } from '../objects/user';
import { UserService } from '../services/user.service';

declare var $: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  user: Account = new Account();

  constructor(private _router: Router, private _userService: UserService) {}

  ngOnInit() {
    $("#button-slide").sideNav();

    // TODO: Add a catch to this service call
    this._userService.get()
      .then((response: Account) => {
        console.log(response);
        this.user = response;
        this.user.firstName = `${this.user.firstName.charAt(0).toUpperCase()}${this.user.firstName.slice(1)}`;
      });
  }

  logout(): void {
    localStorage.clear();
    $("#button-slide").sideNav('destroy');
    this._router.navigate(['login']);
  }
}
