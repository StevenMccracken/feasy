import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanLoad,
  Route
} from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.isValidStorageItem('currentUser') && this.isValidStorageItem('token')) return true;
    else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');

      this.router.navigate(['/login']);
      return false;
    }
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  canLoad(route: Route): boolean {
    return this.isValidStorageItem('currentUser') && this.isValidStorageItem('token');
  }

  isValidStorageItem(storageItemKey: string): boolean {
    let storageItem = localStorage.getItem(storageItemKey);
    return storageItem != null && storageItem != undefined && storageItem != '';
  }
}
