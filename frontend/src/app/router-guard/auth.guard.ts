// Import angular packages
import {
  Route,
  Router,
  CanLoad,
  CanActivate,
  CanActivateChild,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Injectable } from '@angular/core';

// Import 3rd party libraries
import { Observable } from 'rxjs/Observable';

// Import our files
import { LocalStorageService } from '../utils/local-storage.service';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(private _router: Router, private _storage: LocalStorageService) {}

  // TODO: Add formal documentation
  canActivate(_next: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    if (this._storage.isValidItem('currentUser') && this._storage.isValidItem('token')) return true;
    else {
      this._storage.deleteItem('token');
      this._storage.deleteItem('currentUser');

      this._router.navigate(['/login']);

      // TODO: Does this statement even get evaluated?
      return false;
    }
  }

  // TODO: Add formal documentation
  canActivateChild(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    return this.canActivate(_route, _state);
  }

  /**
   * Determines whether or not a specific route can be loaded and routed to
   * @param {Route} _route the specific route in the app
   * @return {boolean} whether or note the route can be loaded
   */
  canLoad(_route: Route): boolean {
    return this._storage.isValidItem('currentUser') && this._storage.isValidItem('token');
  }
}
