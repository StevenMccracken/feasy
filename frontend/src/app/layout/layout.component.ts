import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { Account } from '../objects/user';

declare var $: any;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {

  constructor(private _router: Router, private _userService: UserService) { }
  user: Account = new Account();

  ngOnInit() {
    $("#button-slide").sideNav();

    this._userService.get()
                     .then((res: Account) => {
                       console.log(res);
                       this.user = res;
                       this.user.firstName = this.user.firstName.charAt(0).toUpperCase() + this.user.firstName.slice(1);
                     }
                     );
  }

  logout(): void{
    localStorage.clear();
    $("#button-slide").sideNav('destroy');
    this._router.navigate(['login']);
  }

  closeNav(link: string): void{
    console.log('hello');
    $('#button-slide').sideNav('hide');
    if(link == '/main/calendar')
      this._router.navigate([link]);
  }
}
