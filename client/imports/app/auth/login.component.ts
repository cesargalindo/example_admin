import { Component, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { Router} from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/UserService';

import template from './login.component.html';

@Component({
  selector: 'login',
  template,
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  error: string;
  display_spinner: boolean = false;

  cellEmailValue: string;

  constructor(
      private formBuilder: FormBuilder,
      public _userService: UserService,
      public _authService: AuthService,
      private _ngZone: NgZone,
      private router: Router) { }

  ngOnInit() {
    // if logged in redirect to home page
    if ( Meteor.userId() ) {
      this.router.navigate(['/']);
    }

    this.error = '';

    this.loginForm = this.formBuilder.group({
      cellEmail: [''],
      password: ['']
    });
  }


  login() {

    if (this.validateFullForm()) {

      this.display_spinner = true;

        this._authService.login(this.cellEmailValue, this.loginForm.value.password).subscribe(() => {

          this._ngZone.run(() => { // run inside Angular2 world

            this.display_spinner = false;

            if (this._authService.isLoggedIn) {

              this._userService.initializeUserInfo(false);

              // Get the redirect URL from our auth service
              // If no redirect has been set, use the default

              let redirect = '/';

              if (this._authService.redirectUrl == undefined) {
                // leave redirect set to home
              }
              else if (this._authService.redirectUrl.indexOf(';') !== -1) {
                // TODO - figure out how to redirect urls with params as { itemId: "hghgyghjnjydrfa" }
                redirect = '/';
              }
              else {
                console.log('==== got state.url');
                redirect = this._authService.redirectUrl;
              }

              // Redirect the user
              this.router.navigate([redirect]);
            }
            else {
              this.error = this._authService.error;
            }

          });

        });

    }

    this._authService.isAdmin = undefined;
  }


  /**
   *  Validate all form fields
   */
  validateFullForm() {

    if ( this.loginForm.value.cellEmail.match(/^\d/) || this.loginForm.value.cellEmail.match(/^\(/) ) {
      this.cellEmailValue = this.loginForm.value.cellEmail.replace(/\D/g, '');

      if (this.cellEmailValue.length == 10) {
          if (this.passwordValidator(this.loginForm.value.password)) {
            return true;
          }
      }
    }
    else {
      this.cellEmailValue = this.loginForm.value.cellEmail.trim();

      if (this.emailValidator(this.cellEmailValue)) {
        if (this.passwordValidator(this.loginForm.value.password)) {
          return true;
        }
      }
    }

    return false;
  }


  /**
   * Email is in the format foo@moo.com
   * Format cellphone to (209) 334 - 3434
   * Cellphone must be at least 10 digits
   */
  cellphoneFormat(cellphone: string) {

    console.log('cellphone = ' + cellphone);
    if ( cellphone.match(/^\d/) || cellphone.match(/^\(/) ) {
      // Strip all characters from the input except digits
      let input = cellphone.replace(/\D/g, '');

      // Trim the remaining input to ten characters, to preserve phone number format
      input = input.substring(0, 10);

      // Based upon the length of the string, we add formatting as necessary
      var size = input.length;
      if (size == 0) {
        input = input;
      } else if (size < 4) {
        input = '(' + input;
      } else if (size < 7) {
        input = '(' + input.substring(0, 3) + ') ' + input.substring(3, 6);
      } else {
        input = '(' + input.substring(0, 3) + ') ' + input.substring(3, 6) + ' - ' + input.substring(6, 10);
      }

      this.loginForm.patchValue({cellEmail: input});
    }

  }

  /**
   * Validate cell phone number
   * 
   * @param cellphone 
   */
  cellphoneValidator(cellphone: string): boolean {

    if ( cellphone.match(/^\d/) || cellphone.match(/^\(/) ) {
      // Strip all characters from the input except digits
      let input = cellphone.replace(/\D/g, '');

      if (input.length == 10) {
        return true;
      }

      return false;
    }

    return true;
  }


  /**
   * Validate email
   * 
   * @param email 
   */
  emailValidator(email:string): boolean {
    email = email.trim();

    if  (email.length > 50)  { return false; }

    if ( !(email.match(/^\d/) || email.match(/^\(/)) ) {

      let EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

      if (!EMAIL_REGEXP.test(email)) {
        return false;
      }
    }

    return true;

  }

  passwordValidator(password: string): boolean {
    if  ( (password.length > 5) && (password.length < 41) ) {
      return true;
    }
    return false;
  }


}