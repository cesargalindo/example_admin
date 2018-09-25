import { Component, NgZone, OnInit }   from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { Observable } from 'rxjs';
import { Router }  from '@angular/router';

import { UserService } from '../services/UserService';

import gql from 'graphql-tag';

import template from './users-list.html';

@Component({
    selector: 'users-list',
    template
})

export class UsersListComponent implements OnInit {
    apolloUsers1: ApolloQueryObservable<any>;
    apolloUsersCount1: ApolloQueryObservable<any>;

    pageSize: number = 30;
    sortOrder: number = -1;
    searchTerm: string = '';

    p: number = 1;
    total: number;

    termForm: FormGroup;
    usersList: Observable<Array<Object>>;

    cellVerifiedForm = FormGroup;
    cellVerifiedValue: number;
    cellVerifiedList: Array<any>;

    emailVerifiedForm = FormGroup;
    emailVerifiedValue: number;
    emailVerifiedList: Array<any>;

    withdrawForm = FormGroup;
    withdrawValue: number;
    withdrawList: Array<any>;

    requestForm = FormGroup;
    requestValue: number;
    requestList: Array<any>;

    submitForm = FormGroup;
    submitValue: number;
    submitList: Array<any>;

    display_spinner: boolean = true;

    constructor(
        private apollo: Angular2Apollo,
        private formBuilder: FormBuilder,
        private router: Router,
        private _ngZone: NgZone,
        private _userService: UserService) { }

    ngOnInit() {
        this.termForm = this.formBuilder.group({
            value: [ '' ]
        });

        this.usersList = this.termForm.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .switchMap(term => this._userService.userEmailSearch(term.value));

        this.usersList.subscribe(x => {
            console.log(x);
            console.log(this.termForm.value.value);
        });

        this.cellVerifiedForm = this.formBuilder.group({
            value: ['']
        });
        this.cellVerifiedList = [
            {value: 99, viewValue: '--'},
            {value: 0, viewValue: 'false'},
            {value: 1, viewValue: 'true'},
        ];
        this.cellVerifiedValue = 99;

        this.emailVerifiedForm = this.formBuilder.group({
            value: ['']
        });
        this.emailVerifiedList = [
            {value: 99, viewValue: '--'},
            {value: 0, viewValue: 'false'},
            {value: 1, viewValue: 'true'},
        ];
        this.emailVerifiedValue = 99;


        this.withdrawForm = this.formBuilder.group({
            value: ['']
        });
        this.withdrawList = [
            {value: 99, viewValue: '--'},
            {value: -1, viewValue: 'blocked-fraud'},
            {value: 0, viewValue: 'pending'},
            {value: 1, viewValue: 'active'},
            {value: 2, viewValue: 'activebyDeposit'},
        ];
        this.withdrawValue = 99;

        this.requestForm = this.formBuilder.group({
            value: ['']
        });
        this.requestList = [
            {value: 99, viewValue: '--'},
            {value: -1, viewValue: 'blocked-fraud'},
            {value: 0, viewValue: 'pending'},
            {value: 1, viewValue: 'active'},
        ];
        this.requestValue = 99;

        this.submitForm = this.formBuilder.group({
            value: ['']
        });
        this.submitList = [
            {value: 99, viewValue: '--'},
            {value: -1, viewValue: 'blocked-fraud'},
            {value: 0, viewValue: 'pending'},
            {value: 1, viewValue: 'active'},
        ];
        this.submitValue = 99;

        this.getPage(1, '');
    }

    getPage(page: number, searchTerm: string) {

        if (searchTerm != undefined) {
            this.searchTerm = searchTerm;
        }

        this.getPageInfo(page);
    }

    getPageInfo(page) {

        // Load count
        this.apolloUsersCount1 = this.apollo.watchQuery({
            query: gql`
            query UsersCount1($email: String, $cellVerified: Int, $emailVerified: Int, $withdraw: Int, $request: Int, $submit: Int) {
              apUsersCount(email: $email, cellVerified: $cellVerified, emailVerified: $emailVerified, withdraw: $withdraw, request: $request, submit: $submit) {
                count
              }
            }
          `,
            variables: {
                email: this.termForm.value.value,
                cellVerified: this.cellVerifiedValue,
                emailVerified: this.emailVerifiedValue,
                withdraw: this.withdrawValue,
                request: this.requestValue,
                submit: this.submitValue
            },
            fetchPolicy: 'network-only'
        })
            .map( x => {
                console.warn('######## THE COUNT ####### ' +  x.data.apUsersCount.count);
                // console.log(x.data);
                this.total = x.data.apUsersCount.count;
            });

        // Load data
        this.p = page;

        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {createdAt: this.sortOrder},
        };

        let serializeOptions = JSON.stringify(options);


        this._ngZone.run(() => { // run inside Angular2 world
            this.apolloUsers1 = this.apollo.watchQuery({
                query: gql`
                    query Users1($email: String, $cellVerified: Int, $emailVerified: Int, $withdraw: Int, $request: Int, $submit: Int, $options: String) {
                        apUsers(email: $email, cellVerified: $cellVerified, emailVerified: $emailVerified, withdraw: $withdraw, request: $request, submit: $submit, options: $options) {
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
                variables: {
                    email: this.termForm.value.value,
                    cellVerified: this.cellVerifiedValue,
                    emailVerified: this.emailVerifiedValue,
                    withdraw: this.withdrawValue,
                    request: this.requestValue,
                    submit: this.submitValue,
                    options: serializeOptions
                },
                fetchPolicy: 'network-only'
            })
                .map( ({ data }) => {
                    // this.display_spinner = false;
                    console.warn('######## THE DATA ####### ' +  data.apUsers.length);
                    console.warn(data.apUsers);
                    return data.apUsers;
                });
        });
    }


    applyFilter() {
        this.getPage(1, this.searchTerm);
    }

    editUser(u) {
        console.log(u);
        this.router.navigate(['/users-edit', { userId: u._id, email: u.emails[0].address }]);
    }

}

