import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Angular2Apollo } from 'angular2-apollo';
import { Observable } from 'rxjs';
import { Router }  from '@angular/router';

import { VariablesService } from '../services/VariablesService';
import { UserService } from '../services/UserService';

import template from "./transfers-list.html";

@Component({
    selector: 'transfers-list',
    template,
})
export class TransfersListComponent implements OnInit {

    usersFromForm: FormGroup;
    usersFrom: Observable<Array<Object>>;

    owner: string;

    error: string;
    super: boolean = false;

    transfers: Array<any>;

    constructor(
        private formBuilder: FormBuilder,
        public _varsService: VariablesService,
        private router: Router,
        private _userService: UserService,        
        private _ngZone: NgZone) { }

    ngOnInit() {
        this._varsService.setReactiveTitleName('My Work');

        this.usersFromForm = this.formBuilder.group({
            fromValue: [ '' ]
        });

        // Allow admin to view other user's transfers
        console.warn(Meteor.user().roles);
        if ( _.indexOf(Meteor.user().roles, "superadmin") > -1) {
            this.super = true;

            this.usersFrom = this.usersFromForm.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .switchMap(toTerm => this._userService.userEmailSearch(toTerm.fromValue));

            this.usersFrom.subscribe(x => {
                console.log(x);
            });

        }
        else {
            // getTransfersInfo for logged in user
            let info = this._userService.userEmailSearch(Meteor.user().emails[0].address);
            info.subscribe(x => {
                console.log(x);
                console.log(x.length);
                this.owner = x[0]._id;
                this.getTransfersInfo();
            });
        }
    }

    
    getTransfersInfo() {
        Meteor.call('ddp.transfers.get', this.owner, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world

                if (err) {
                    console.error("!!!!!!!! GOT AN ERROR ON: transfers.get..... !!!!!!!!!");
                    console.error(err);
                    this.error = err;
                }
                else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: transfers.get ..... !!!!!!!!! == " + res.error);
                        console.error(err);
                        this.error = res.error;
                    }
                    else {
                        console.warn("SUCCESSFULLY called transfers.get... " + res.status);
                        console.warn(res);
                        this.transfers = res.data;
                    }
                }

            });
        });
    }


    selectFromUser(u) {
        this.owner = u._id;
        this.usersFromForm.patchValue({
            fromValue: u.emails[0].address
        });
    }

    
    getOwnerInfo() {
        this.getTransfersInfo();        
    }

    detailedView(sp) {
        this.router.navigate(['/spdetails', { spId: sp._id, redirect: 'spclosed' }]);
    }

}
