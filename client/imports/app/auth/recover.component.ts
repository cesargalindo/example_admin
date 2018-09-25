import { Component, OnInit, NgZone } from '@angular/core';
import { Accounts } from 'meteor/accounts-base';
import { FormGroup, FormBuilder } from '@angular/forms';

import template from './recover.component.html';

@Component({
  selector: 'recover',
  template
})
export class RecoverComponent implements OnInit {

  recoverForm: FormGroup;

  error: string;
  passwordReset: boolean = false;
  display_spinner: boolean = false;

  constructor(
      private formBuilder: FormBuilder,
      private _ngZone: NgZone) { }


  ngOnInit() {
    this.error = '';

    this.recoverForm = this.formBuilder.group({
      email: ['']
    });
  }


  recover() {

    if (this.emailValidator(this.recoverForm.value.email)) {

      this.display_spinner = true;

      Accounts.forgotPassword({ email: this.recoverForm.value.email.trim() }, (err) => {
        this.forgotPasswordResult(err);
      });
    }
    else {

    }

  }

  /**
   * Move this code outside of scope of Accounts.forgotPassword(..) to ensure reactivity of view
   *
   */
  forgotPasswordResult(err) {

    this._ngZone.run(() => { // run inside Angular2 world

      if (err) {
        this.error = err;
        this.display_spinner = false;

      }
      else {
        this.error = '';
        this.passwordReset = true;
        this.display_spinner = false;
      }

    });

    console.warn('debug - forgotPasswordResult function called');
  }

  /**
   * 
   * @param email 
   */
  emailValidator(email:string): boolean {

    email = email.trim();

    if  (email.length > 50)  { return false; }

    let EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!EMAIL_REGEXP.test(email)) {
      return false;
    }
    return true;
  }
}