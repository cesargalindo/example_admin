import { Meteor } from 'meteor/meteor';
import { Component, NgZone, OnInit }   from '@angular/core';
import { ActivatedRoute }  from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { UserService } from '../services/UserService';
import { VariablesService} from '../services/VariablesService';

import gql from 'graphql-tag';

import template from './users-edit.html';


@Component({
    selector: 'users-edit',
    template,
})
export class UsersEditComponent implements OnInit {
    userId: string;
    display_spinner: boolean = false;

    apolloUser2: ApolloQueryObservable<any>;

    cellVerifiedForm: FormGroup;
    cellVerifiedValue: number;
    cellVerifiedList: Array<any>;

    emailVerifiedForm: FormGroup;
    emailVerifiedValue: number;
    emailVerifiedList: Array<any>;

    withdrawForm: FormGroup;
    withdrawValue: number;
    withdrawList: Array<any>;

    requestForm: FormGroup;
    requestValue: number;
    requestList: Array<any>;

    submitForm: FormGroup;
    submitValue: number;
    submitList: Array<any>;

    itemMatchFrom: FormGroup;

    cell: number;
    email: string;
    score: number;
    firstname: string;
    lastname: string;
    ownerId: string;

    error: string;
    success: string;
    error2: string;
    success2: string;

    contractorEmailsForm: FormGroup;
    contractor: boolean = false;
    leadContractor: boolean = false;
    superadmin: boolean = false;
    localUserId: string;
    storesList: Array<any>;
    
    constructor(private route: ActivatedRoute,
                private _ngZone: NgZone,
                private formBuilder: FormBuilder,
                public _userService: UserService,
                public _varsService: VariablesService,              
                private apollo: Angular2Apollo) { }


    ngOnInit() {

        this.route.params.subscribe((params) => {
            // for reason(s) unkown to me, setting form value to 0 doesn't show up in view
            // 0 = -22
            this.cellVerifiedForm = this.formBuilder.group({
                value: ['']
            });
            this.cellVerifiedList = [
                {value: 99, viewValue: '--'},
                {value: -22, viewValue: 'false'},
                {value: 1, viewValue: 'true'},
            ];
            this.cellVerifiedValue = 1;

            this.emailVerifiedForm = this.formBuilder.group({
                value: ['']
            });
            this.emailVerifiedList = [
                {value: 99, viewValue: '--'},
                {value: -22, viewValue: 'false'},
                {value: 1, viewValue: 'true'},
            ];
            this.emailVerifiedValue = 99;

            this.withdrawForm = this.formBuilder.group({
                value: ['']
            });
            this.withdrawList = [
                {value: 99, viewValue: '--'},
                {value: -1, viewValue: 'blocked-fraud'},
                {value: -22, viewValue: 'pending'},
                {value: 1, viewValue: 'active'},
                {value: 2, viewValue: 'activebyDeposit'},
            ];

            this.requestForm = this.formBuilder.group({
                value: ['']
            });
            this.requestList = [
                {value: 99, viewValue: '--'},
                {value: -1, viewValue: 'blocked-fraud'},
                {value: -22, viewValue: 'pending'},
                {value: 1, viewValue: 'active'},
            ];

            this.submitForm = this.formBuilder.group({
                value: ['']
            });
            this.submitList = [
                {value: 99, viewValue: '--'},
                {value: -1, viewValue: 'blocked-fraud'},
                {value: -22, viewValue: 'pending'},
                {value: 1, viewValue: 'active'},
            ];

            this.itemMatchFrom = this.formBuilder.group({
                skip: [0],
                total: [0],
            });

            this.storesList = this._varsService.storeChains;
            this.storesList.push({value: "", viewValue: "--" });

            // Edit existing User
            if (params['userId']) {

                if (params['email']) {
                    Meteor.call('getLocaUserInfoByEmail', params['email'], (error, res) => {
                        this._ngZone.run(() => { // run inside Angular2 world
                            if (error) {
                                alert("ERROR: editing user does not exist??");
                                console.error(error)
                            }
                            else {
                                console.log(res);
                                this.localUserId = res._id;
    
                                if (res.roles) {
                                    if ( _.indexOf(res.roles, "contractor") > -1) {
                                        this.contractor = true;
                                    }
                                    if ( _.indexOf(res.roles, "leadContractor") > -1) {
                                        this.leadContractor = true;
                                    }
                                    if ( _.indexOf(res.roles, "superadmin") > -1) {
                                        this.superadmin = true;
                                    }
                                }
    
                                let storeChain = '';
                                if (res.storeChain != undefined) {
                                    storeChain = res.storeChain;
                                }

                                if (res.contractorEmails) {
                                    this.contractorEmailsForm = this.formBuilder.group({
                                        emails: [ res.contractorEmails ],
                                        store: [ storeChain ]
                                    });
                                }
                                else {
                                    this.contractorEmailsForm = this.formBuilder.group({
                                        emails: [''],
                                        store: [ storeChain ]
                                    });
                                }

                                if (res.skip) {
                                    this.itemMatchFrom.patchValue({
                                        skip: res.skip,
                                    });
                                }
                                if (res.total) {
                                    this.itemMatchFrom.patchValue({
                                        total: res.total
                                    });
                                }
                            }
                        });
                    });
                }
 
                
                this.userId = params['userId'];                
                
                this.apolloUser2 = this.apollo.query({
                    query: gql`
                      query UserInfoQuery2($id: String) {
                        apUserbyId(id: $id) {
                            _id
                            userProfile {
                                firstname
                                lastname
                            }
                            ranking {
                                score
                                downVotes
                                upVotes
                                thumbsUp
                                thumbsDown
                            }
                            emails {
                                address
                                verified
                            }
                            username
                            cellVerified
                            withdrawalStatus
                            submitStatus
                            requestStatus
                            roles {
                                role
                            }
                        }
                      }
                    `,
                    fetchPolicy: 'network-only',
                    variables: {
                        id: this.userId
                    }
                })
                    .map( ({ data }) => {

                        this._ngZone.run(() => { // run inside Angular2 world
                            this.ownerId = data.apUserbyId._id;

                            if (data.apUserbyId.cellVerified) {
                                this.cellVerifiedValue = 1;
                            }
                            else {
                                this.cellVerifiedValue = -22;
                            }
                            if (data.apUserbyId.emails[0].verified) {
                                this.emailVerifiedValue = 1;
                            }
                            else {
                                this.emailVerifiedValue = -22;
                            }

                            if (data.apUserbyId.withdrawalStatus == 0) {
                                this.withdrawValue = -22;
                            }
                            else {
                                this.withdrawValue = data.apUserbyId.withdrawalStatus;
                            }

                            if (data.apUserbyId.requestStatus == 0) {
                                this.requestValue = -22;
                            }
                            else {
                                this.requestValue = data.apUserbyId.requestStatus;
                            }

                            if (data.apUserbyId.submitStatus == 0) {
                                this.submitValue = -22;
                            }
                            else {
                                this.submitValue = data.apUserbyId.submitStatus;
                            }

                            this.cell = data.apUserbyId.username;
                            this.email = data.apUserbyId.emails[0].address;
                            this.score = data.apUserbyId.ranking.score;

                            this.firstname = 'first';
                            this.lastname = 'last';
                            if ( data.apUserbyId.userProfile != null) {
                                if (data.apUserbyId.userProfile.hasOwnProperty('firstname')) {
                                    this.firstname = data.apUserbyId.userProfile.firstname;
                                }
                                if (data.apUserbyId.userProfile.hasOwnProperty('lastname')) {
                                    this.lastname = data.apUserbyId.userProfile.lastname;
                                }
                            }


                            return data.apUserbyId;
                        });

                    });
            }

        });
    }



    /**
     *
     */
    EditUser() {

        this.error = '';
        this.success = '';
        this.display_spinner = true;

        let emailVerifiedValue = true;
        if ((this.emailVerifiedValue == 99) || (this.emailVerifiedValue == -22) || (this.emailVerifiedValue == null)) {
            emailVerifiedValue = false;
        }

        let cellVerifiedValue = true;
        if ((this.cellVerifiedValue == 99) || (this.cellVerifiedValue == -22) || (this.cellVerifiedValue == null)) {
            cellVerifiedValue = false;
        }

        let withdrawValue = this.withdrawValue;
        if ((this.withdrawValue == 99) || (this.withdrawValue == -22) || (this.withdrawValue == null)) {
            withdrawValue = 0;
        }

        let submitValue = this.submitValue;
        if ((this.submitValue == 99) || (this.submitValue == -22) || (this.submitValue == null)) {
            submitValue = 0;
        }

        let requestValue = this.requestValue;
        if ((this.requestValue == 99) || (this.requestValue == -22) || (this.requestValue == null)) {
            requestValue = 0;
        }

        let uu = {
            emailVerified: emailVerifiedValue,
            cellVerified: cellVerifiedValue,
            withdrawalStatus: withdrawValue,
            submitStatus: submitValue,
            requestStatus: requestValue,
            ownerId: this.ownerId
        };

        // Change user password
        Meteor.call('ddp.users.update', uu, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                this.display_spinner = false;

                if (err) {
                    console.error("!!!!!!!! ERROR: Update user !!!!!!!!!");
                    console.error(err);
                    this.error = err;
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR: User.update..." + res.error);
                        this.error = res.error;
                        return;
                    }
                    else {
                        // Force reload of UserProfile info
                        this._userService.initializeUserInfo(true);
                        console.log("SUCCESSFULLY UPDATED USER...");
                        this.success = 'Sucessfuly updated user: ' + this.email;
                    }
                }
            });
        });

    }


    /**
     * Update local user Roles and leadContractor emails
     * 
     */
    updateLocalUser() {

        Meteor.call('updateLocalUserInfo', this.localUserId, this.contractor, this.leadContractor, this.superadmin, this.contractorEmailsForm.value.emails, this.itemMatchFrom.value.skip, this.itemMatchFrom.value.total, this.contractorEmailsForm.value.store, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: Update local user !!!!!!!!!");
                    console.error(err);
                    this.error2 = err;
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR: local User.update " + res.error);
                        this.error2 = res.error;
                        return;
                    }
                    else {
                        // Force reload of UserProfile info
                        this._userService.initializeUserInfo(true);
                        console.log("SUCCESSFULLY UPDATED LOCAL USER...");
                        this.success2 = 'Sucessfuly updated user roles.';
                    }
                }
            });
        });
    }


    /**
     * Add new local user to admin site
     * 
     */
    addNewUser() {
        Meteor.call('addNewLocalUser', this.email, this.cell, this.firstname, this.lastname, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: Adding local user !!!!!!!!!");
                    console.error(err);
                    this.error2 = err;
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR: Adding new local User " + res.error);
                        this.error2 = res.error;
                        return;
                    }
                    else {
                        // Force reload of UserProfile info
                        this._userService.initializeUserInfo(true);
                        console.log("SUCCESSFULLY Added LOCAL USER...");
                        this.success2 = 'Sucessfuly add user. Please remember this password: ' + res.password;
                    }
                }
            });
        });
    }


}
