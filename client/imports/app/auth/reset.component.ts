import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { FormGroup, FormBuilder } from '@angular/forms';
import { UserService } from '../services/UserService';

import { AuthService } from '../services/auth/auth.service';

import template from './reset.component.html';

@Component({
    selector: 'reset',
    template
})
export class ResetComponent implements OnInit {

    resetForm: FormGroup;
    error: string;
    display_spinner: boolean = true;

    token: string;

    constructor(
        private formBuilder: FormBuilder,
        public _userService: UserService,
        public _authService: AuthService,
        private route: ActivatedRoute,
        private _ngZone: NgZone,
        private router: Router) { }


    ngOnInit() {
        this.error = '';
        this.resetForm = this.formBuilder.group({
            password: ['']
        });
    }


    reset() {
        this.route.params.subscribe((params) => {
            this.token = params['token'];

            if (this.passwordValidator(this.resetForm.value.password)) {

                // WHEN DONE WITH THIS CONFIRM I CAN RESET PASSWORD FOR FACEBOOK USER
                this.display_spinner = true;

                Accounts.resetPassword(this.token, this.resetForm.value.password, (err) => {

                    this.resetPasswordResult(err);

                });
            }

        });
    }

    /**
     * Move this code outside of scope of Accounts.resetPassword(...) to ensure reactivity of view
     *
     */
    resetPasswordResult(err) {

        this._ngZone.run(() => { // run inside Angular2 world
            if (err) {
                this.error = err;
                this.display_spinner = false;
            }
            else {
                this.error = '';
                this.display_spinner = false;

                alert('password reset userId = ' + Meteor.userId());

                // Initialize login checks - call async function, then use Reactive login to update login status
                this._authService.checkLogin();
                this._userService.initializeUserInfo(false);

                // this.router.navigate(['/'], { skipLocationChange: true });

                this.router.navigate(['/']);
            }
        });

    }

    /**
     * Validate password requirements
     * @param password 
     */
    passwordValidator(password: string): boolean {
        if  ( (password.length > 5) && (password.length < 41) ) {
            return true;
        }
        return false;
    }

}