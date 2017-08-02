import {
  Route,
  Router,
  CanLoad,
  CanActivate,
  CanActivateChild,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(private _router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.isValidStorageItem('currentUser') && this.isValidStorageItem('token')) return true;
    else {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');

      this._router.navigate(['/login']);
      return false;
    }
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }

  canLoad(route: Route): boolean {
    return this.isValidStorageItem('currentUser') && this.isValidStorageItem('token');
  }

  /**
   * Determines if a specific local storage item contains any meaningful data
   * @param {string} storageItemKey the key of the local storage item
   * @return {boolean} whether or not the key contains a meaningful (non-empty) data value
   */
  isValidStorageItem(storageItemKey: string): boolean {
    let storageItem = localStorage.getItem(storageItemKey);
    return storageItem != null && storageItem != undefined && storageItem != '';
  }
}
