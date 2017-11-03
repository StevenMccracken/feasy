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

// Import our files
import { LocalStorageService } from '../utils/local-storage.service';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(private ROUTER: Router, private STORAGE: LocalStorageService) {}

  // TODO: Add formal documentation
  canActivate(_next: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    if (this.STORAGE.isValidItem('currentUser') && this.STORAGE.isValidItem('token')) return true;
    else {
      this.STORAGE.deleteItem('token');
      this.STORAGE.deleteItem('currentUser');

      this.ROUTER.navigate(['/login']);

      // TODO: Does this statement even get evaluated?
      return false;
    }
  } // End canActivate()

  // TODO: Add formal documentation
  canActivateChild(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    return this.canActivate(_route, _state);
  } // End canActivateChild()

  /**
   * Determines whether or not a specific route can be loaded and routed to
   * @param {Route} _route the specific route in the app
   * @return {boolean} whether or note the route can be loaded
   */
  canLoad(_route: Route): boolean {
    return this.STORAGE.isValidItem('currentUser') && this.STORAGE.isValidItem('token');
  } // End canLoad()
}
