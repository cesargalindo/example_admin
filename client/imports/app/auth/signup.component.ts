import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Accounts } from 'meteor/accounts-base';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/UserService';
import { VariablesService } from '../services/VariablesService';

import template from './signup.component.html';

/**
 *
 * Signup Flows:
 *
 */
@Component({
  selector: 'signup-component',
  template,
})
export class SignupComponent implements OnInit {

  signUpForm: FormGroup;
  error: string;
  cordova: boolean = false;
  display_spinner: boolean = false;
  docs_url: string;

  constructor(
      private formBuilder: FormBuilder,
      public _authService: AuthService,
      public _var: VariablesService,
      public _userService: UserService,
      private _ngZone: NgZone,
      private router: Router) { }

  ngOnInit() {
    this.error = '';

    this.docs_url = Meteor.settings.public.DOCS_URL;

    // Cordova flow
    this.cordova = (Meteor.isCordova || true);

    this.signUpForm = this.formBuilder.group({
      email: [''],
      cellphone: [''],
      password: ['']
    });

  }



  /**
   *  Sign up or log in with Facebook
   */
  loginWithFacebook() {

    // Cordova flow
    if (this.cordova) {

      console.warn('LOGIN IN WITH FACEBOOK 11....');

      Meteor.loginWithFacebook({
        requestPermissions: ['user_friends', 'public_profile', 'email']
      }, (err) => {

        this.loginWithFacebookResult(err);

      });

    }
    else {
      this.error = 'Please download the app onto your cell phone to register.'
    }

  }


  /**
   * Move this code outside of scope of Meteor.loginWithFacebook(..) to ensure reactivity of view
   */
  loginWithFacebookResult(err) {

      if (err) {
        // handle error
        alert(err);
        console.error(err);
        this.error = err.message;
      }
      else {
        // successful login!

        console.warn('debug - successful login Facebook login...11 -- ' + Meteor.userId());

        // confirm default ledger has been created
        Meteor.call('initializeUserLedger');

        // apply default settings to Facebook login
        Meteor.call('updateFacebookLogin', (error, res) => {

          if (error) {
            this.error = error;
          }
          else {
            console.warn('debug - success from server --- ' + res);
          }
        });

        console.warn('debug - successful login Facebook login...33 -- ' + Meteor.userId());

        this._authService.checkLogin();
        this._userService.initializeUserInfo(false);

        this.router.navigate(['/']);

      }
  }



  /**
   *
   */
  signUp() {

    // Cordova flow
    if (this.cordova) {

      // TODO - retrieve this from Cordova app automatically
      // let cellPhoneNumber = '444-444-4444';
      // let cellPhoneNumber = '123-111-1112';

      let cellPhoneNumber = this.signUpForm.value.cellphone.replace(/\D/g, '');

      if (this.validateFullForm(cellPhoneNumber)) {

        this.display_spinner = true;
        this.error = '';

        // Confirm user phone number is unique
        Meteor.call('confirmCellphoneNumber', cellPhoneNumber,  (error, res) => {

          if (error) {
            this.error = error;
          }
          else {

            if (res) {
              // create account - phone number doesn't exist
              Accounts.createUser({ username: cellPhoneNumber, email: this.signUpForm.value.email.trim(), password: this.signUpForm.value.password}, (err) => {
                this.createUserResult(err);
              });
            }
            else {
              this.error = 'This phone number is already in use.'
            }

          }
        });

      }

    }
    else {
      this.error = 'Please download the app onto your cell phone to register.'
    }

  }


  /**
   * Move this code outside of scope of Accounts.createUser(..) to ensure reactivity of view
   */
  createUserResult(err) {

    this._ngZone.run(() => { // run inside Angular2 world

      this.display_spinner = false;

      if (err) {
        if (err.reason == 'Username already exists.') {
          err.message = 'Cellphone number already exists.';
        }

        this.error = err;
        this._authService.checkLogin();
      }
      else {

        // Initialize user ledger
        Meteor.call('initializeUserLedger');

        this._authService.checkLogin();
        this._userService.initializeUserInfo(false);

        this.router.navigate(['/']);
      }

    });


  }


  /**
   *  Validate all form fields
   */
  validateFullForm(cellPhoneNumber) {
    if ( cellPhoneNumber.length == 10) {
      if ( this.emailValidator(this.signUpForm.value.email) ) {
        if ( this.passwordValidator(this.signUpForm.value.password) ) {
            return true;
        }
      }
    }

    return false;
  }


  /**
   * Format cellphone to (209) 334 - 3434
   */
  cellphoneFormat(cellphone: string) {

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

    this.signUpForm.patchValue({cellphone: input});
  }


  /**
   * 
   * @param cellphone 
   */
  cellphoneValidator(cellphone: string): boolean {
    // Strip all characters from the input except digits
    let input = cellphone.replace(/\D/g, '');

    if (input.length == 10) {
      return true;
    }

    return false;
  }


  emailValidator(email:string): boolean {
    email = email.trim();

    if  (email.length > 50)  { return false; }

    let EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!EMAIL_REGEXP.test(email)) {
      return false;
    }
    return true;
  }

  passwordValidator(password: string): boolean {
    if ( (password.length > 5) && (password.length < 41) ) {
      return true;
    }
    return false;
  }


}