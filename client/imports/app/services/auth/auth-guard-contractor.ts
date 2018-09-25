import { Injectable }                                                           from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot }     from '@angular/router';
import { AuthService }                                                          from './auth.service';

@Injectable()
export class AuthGuardContractor implements CanActivate {
    constructor(private _authService: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (this._authService.isContractor ) { return true; }

        // Store the attempted URL for redirecting
        this._authService.redirectUrl = state.url;

        console.log('STATE URL == ' + state.url);
        // Navigate to the home page
        this.router.navigate(['/']);
        return false;
    }

}
