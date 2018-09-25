import { Injectable }                                                           from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot }     from '@angular/router';
import { AuthService }                                                          from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private _authService: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        // ff-1 on page refreshes _authService.isLoggedin may not be ready
        // ff-2 redirects to login page - login calls UserService.ts but just loads constructor
        // ff-3 since user is logged in - it redirects to home page
        // ff-4 homepage initializes everything - calls app.component.ts

        if (this._authService.isLoggedIn) { return true; }

        // Store the attempted URL for redirecting
        this._authService.redirectUrl = state.url;
        console.log('STATE URL == ' + state.url);

        // Navigate to the login page
        this.router.navigate(['/login']);
        return false;
    }

}
