import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { LoginService } from '../services/login.service';

@Component({
    moduleId: module.id,
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    model: any = {};
    loading = false;
    error = '';

    constructor(private router: Router, private loginService: LoginService) { }

    ngOnInit() {
        this.loginService.logout();
    }

    login() {
        this.loading = true;
        this.loginService.login(this.model.username, this.model.password)
            .then((loggedIn) => {
                if (loggedIn) this.router.navigate(['/home']);
                else {
                    this.error = 'Username or password is incorrect';
                    this.loading = false;
                }
            })
            .catch((loginError) => {
                console.error(loginError);
                this.error = 'Username or password is incorrect';
                this.loading = false;
            });
    }
}
