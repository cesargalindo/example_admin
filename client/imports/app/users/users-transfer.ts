import { Component, NgZone, OnInit }   from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { Observable } from 'rxjs';
import { Router }  from '@angular/router';

import gql from 'graphql-tag';

import { VariablesService } from '../services/VariablesService';
import { UserService } from '../services/UserService';
import { Transfer } from '../../../../both/models/transfer.model';

import template from './users-transfer.html';

@Component({
    selector: 'user-transfer',
    template
})

export class UsersTransferComponent implements OnInit {
    apolloItemsCount: ApolloQueryObservable<any>;
    total: number;
    leadContractor: boolean = false;
    limitAmount: boolean = false;
    
    usersFromForm: FormGroup;
    usersFrom: Observable<Array<Object>>;
    userIdFrom: string;
    userEmailFrom: string;
    
    usersToForm: FormGroup;
    usersTo: Observable<Array<Object>>;
    userIdTo: string;
    userEmailTo: string;
    
    display_spinner: boolean = true;
    error: string;
    success: string;

    constructor(
        private apollo: Angular2Apollo,        
        public _varsService: VariablesService,        
        private formBuilder: FormBuilder,
        private router: Router,
        private _ngZone: NgZone,
        private _userService: UserService) { }

    ngOnInit() {
        this._varsService.setReactiveTitleName('Transfer Item Info');
        
        this.usersFromForm = this.formBuilder.group({
            fromValue: [ '' ]
        });

        this.usersFrom = this.usersFromForm.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .switchMap(toTerm => this._userService.userEmailSearch(toTerm.fromValue));

        this.usersFrom.subscribe(x => {
            console.log(x);
            console.log(this.usersFromForm.value.fromValue);
        });



        this.usersToForm = this.formBuilder.group({
            toValue: [ '' ]
        });

        this.usersTo = this.usersToForm.valueChanges
        .debounceTime(400)
        .distinctUntilChanged()
        .switchMap(fromTerm => this._userService.userEmailSearch(fromTerm.toValue));

        this.usersTo.subscribe(x => {
            console.log(x);
            console.log(this.usersToForm.value.toValue);
        });
    }


    selectFromUser(u) {
        this.userIdFrom = u._id;
        this.userEmailFrom = u.emails[0].address;
        this.usersFromForm.patchValue({
            fromValue: u.emails[0].address
        });
    }

    selectToUser(u) {
        this.userIdTo = u._id;        
        this.userEmailTo = u.emails[0].address;
        this.usersToForm.patchValue({
            toValue: u.emails[0].address
        });
    }


    getTransferInfo() {
        this.error = '';
        this.success = '';
        
        if (this.userIdFrom == undefined) {
            this.error = 'From user is undefined';
            return;
        }

        if (this.userIdTo == undefined) {
            this.error = 'To user is undefined';
            return;
        }

        // Get Item transfer count for From user
        this.apolloItemsCount = this.apollo.watchQuery({
        query: gql`
            query ItemsCount($itemName1: String, $itemName2: String, $itemName3: String, $itemName4: String, $itemName5: String, $itemSize: String, $itemUnit: String, $status: Int, $owner: String, $done: Int, $category: String) {
                apItemsCount(itemName1: $itemName1, itemName2: $itemName2, itemName3: $itemName3, itemName4: $itemName4, itemName5: $itemName5, itemSize: $itemSize, itemUnit: $itemUnit, status: $status, owner: $owner, done: $done, category: $category) {
                count
                }
            }
            `,
            variables: {
                itemName1: '',
                itemName2: '',
                itemName3: '',
                itemName4: '',
                itemName5: '',
                itemSize: '',
                itemUnit: '',
                status: 99,
                owner: this.userIdFrom,
                done: 0,
                category: ''
            },
            fetchPolicy: 'network-only'
        })
        .map( x => {
            console.log(x.data);
            this.total = x.data.apItemsCount.count;
        });

        // Verify To user had Lead Contractor role
        Meteor.call('getLocaUserInfoByEmail', this.usersToForm.value.toValue, (error, res) => {

            this._ngZone.run(() => { // run inside Angular2 world
                if (error) {
                    alert("ERROR: editing user does not exist?? " +  this.usersToForm.value.toValue);
                    console.error(error)
                    this.error = error;
                }
                else {
    
                    if (res.roles) {
                        console.log(res);
                        console.log( _.indexOf(res.roles, "contractor") + ' -- ' + _.indexOf(res.roles, "leadContractor") + ' -- ' + _.indexOf(res.roles, "superadmin") );
    
                        if ( _.indexOf(res.roles, "leadContractor") > -1) {
                            this.leadContractor = true;
                        }
                        else {
                            this.error = "To user does not have LeadContractor role";
                        }
    
                        if ( res.contractorEmails.indexOf(this.usersFromForm.value.fromValue) > -1) {
                            this.leadContractor = true;
                        }
                        else {
                            this.error = "From user is not assigned to LeadContractor To user.";
                        }
                    }
                    else {
                        this.error = 'No roles found for this user: ' + this.usersToForm.value.toValue;
                    }
                }
            });

        });

    }


    /**
     * Transfer ownership of items to new user
     * 
     */
    transferItemOwnership() {
        this.error = '';
        this.success = '';
        
        if (confirm("ARE YOU SURE - transfer ownership") == true) {
            let tr = <Transfer>{};
            tr.ownerFrom = this.userIdFrom;
            tr.ownerTo = this.userIdTo;
            tr.status = 1;
            tr.payment = 1;

            Meteor.call('ddp.transfer.insert', tr, (err, res) => {
                
                this._ngZone.run(() => { // run inside Angular2 world
                    this.display_spinner = false;
    
                    if (err) {
                        console.error("!!!!!!!! GO AN ERROR ON: transfer.insert..... !!!!!!!!!");
                        console.error(err);
                        this.error = err;
                    }
                    else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: transfer.insert ..... !!!!!!!!! == " + res.error);
                            console.error(err);
                            this.error = res.error;
                        }
                        else {
                            console.warn("SUCCESSFULLY INSERTED NEW transfer.insert... " + res.status);
                            console.warn(res);
                            this.success = 'Successly transfered ' + res.count + ' items to new owner.';
                        }
                    }
    
                });
            });

        } 
    }


    /**
     * Transfer items from one test account to another
     * Apply limit if desired
     * 
     */
    noTrecordTransfer() {
        this.error = '';
        this.success = '';

        if ( !(  ( (this.userEmailFrom.indexOf('test+') >= 0) || (this.userEmailFrom.indexOf('raw+') >= 0) ) && ( this.userEmailTo.indexOf('test+') >= 0) ) )  {
            alert('No record transfers can only be done between test+ and raw+ accounts');
            return;
        }

        if (confirm("ARE YOU SURE - transfer ownership with no records") == true) {
            let tr = <Transfer>{};
            tr.ownerFrom = this.userIdFrom;
            tr.ownerTo = this.userIdTo;
            tr.status = 2;
            tr.payment = 1;

            Meteor.call('transferItemsNoRecord', tr, this.limitAmount, (err, res) => {
                
                this._ngZone.run(() => { // run inside Angular2 world

                    if (err) {
                        console.error("!!!!!!!! GO AN ERROR ON: No Recrods transfers..... !!!!!!!!!");
                        console.error(err);
                        this.error = err;
                    }
                    else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: No Recrods transfer ..... !!!!!!!!! == " + res.error);
                            console.error(err);
                            this.error = res.error;
                        }
                        else {
                            console.warn("SUCCESSFULLY Completed No Records Transfer... " + res.status);
                            console.warn(res);
                            this.success = 'Successly completed no records transfer ' + res.count + ' items to new owner.';
                        }
                    }

                });
            });
        }


    }


    editUser(u) {
        console.log(u);
        this.router.navigate(['/users-edit', { userId: u._id, email: u.emails[0].address }]);
    }

}

