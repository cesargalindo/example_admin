import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material";
import { Router }  from '@angular/router';
import { UserService } from '../services/UserService';


@Injectable()
export class SnackbarService {

    snackbar_set:boolean = false;

    constructor(
        private router: Router,
        public _userService: UserService,
        public snackBar: MatSnackBar) { this.snackbar_set = false; }

    public displaySnackbar(message) {

        if (message == 1) {
            if(!this.snackbar_set) {
                this.snackBar.open('It didn\'t quite work. Please try again.', 'Dismiss', { duration: 4000});
                this.snackbar_set = true;
            }
        }
        else if (message == 2) {

            if (Meteor.userId()) {
                this.router.navigate(['/profile']);
                this.snackBar.open('Email and cellphone must be verified.', 'Dismiss', { duration: 4000});
            }
            else {
                let snackBarRef = this.snackBar.open('Log in required.', 'Dismiss', { duration: 4000});

                snackBarRef.afterDismissed().subscribe(() => {
                    this.router.navigate(['/login']);
                });
            }
        }
        else if (message == 3) {
            this.snackBar.open('You price request(s) have been submitted. Requests remain active for 24 hours or until fulfilled.', 'Dismiss', { duration: 6000});
            this.snackbar_set = true;

        }

    }


    /**
     * UserService should be loaded, otherwise this would never be called thanks to auth-guard
     *
     */
    public verifyUserAccess(display): boolean {

        if (Meteor.userId()) {
            if (this._userService.cellVerified && Meteor.user().emails[0].verified) {
                return true;
            }

            if (display) {
                this.displaySnackbar(2);
            }
        }

        return false;
    }



    /**
     * Allow snackbar to be displayed again
     */
    public resetSnackbar() {
        this.snackbar_set = false;
    }


}

