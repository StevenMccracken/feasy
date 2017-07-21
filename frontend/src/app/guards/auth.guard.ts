import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  RouterStateSnapshot
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate() {
    if (localStorage.getItem('currentUser')) return true;

    // Not logged in so redirect to login page
    this.router.navigate(['/login']);
    return false;
  }
}
