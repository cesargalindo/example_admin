import { Injectable } from '@angular/core';
import { Meteor } from 'meteor/meteor';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AuthService {

    // don't set default to false - will check for undefined in other places of app
    isLoggedIn: boolean;
    isAdmin: boolean;
    isContractor: boolean;
    isLeadContractor: boolean;
    
    reactiveLogin: Subject<boolean> = new Subject<boolean>();
    reactiveAdminLogin: Subject<boolean> = new Subject<boolean>();
    reactiveContractorLogin: Subject<boolean> = new Subject<boolean>();
    reactiveLeadContractorLogin: Subject<boolean> = new Subject<boolean>();
    
    // store the URL so we can redirect after logging in
    redirectUrl: string;
    error: string;

    checkLogin() {

        if (  Meteor.userId() ) {
            this.isLoggedIn = true;
            this.reactiveLogin.next(true);

            // Check if isAdmin was set...
            if (this.isAdmin == undefined) {

                Meteor.call('checkRoles', Meteor.userId(), (error, res) => {
                    if (error) {
                        this.isAdmin = false;
                        this.reactiveAdminLogin.next(false);
                        this.reactiveContractorLogin.next(false);
                        this.reactiveLeadContractorLogin.next(false);
                    }
                    else {
                        this.isAdmin = res.admin
                        this.reactiveAdminLogin.next(res.admin);

                        this.isContractor = res.contractor;
                        this.reactiveContractorLogin.next(res.contractor);

                        this.isLeadContractor = res.leadContractor;                        
                        this.reactiveLeadContractorLogin.next(res.leadContractor);

                        console.log('isAdmin from server = ' + res.admin + ' == isContractor = ' + res.contractor + ' == isLeadContractor = ' + res.leadContractor );
                    }
                });

            }

        }
        else {
            this.isLoggedIn = false;
            this.isAdmin = false;
            this.reactiveLogin.next(false);
            this.reactiveAdminLogin.next(false);
            this.reactiveContractorLogin.next(false);
            this.reactiveContractorLogin.next(false);
        }
    }

    login(email: string, password: string) {
        console.log(email + ' -- ' + password + ' auth.service -- redirect - login(): ' + this.redirectUrl);

        return new Observable.create(observer => {

            Meteor.loginWithPassword(email, password, (err, res) => {
                if (err) {

                    // console.error(err);
                    // console.error(err.reason);
                    // console.error(err.message);

                    if (err.reason == 'User has no password set') {
                        err.message = 'Password reset is required. Please click on "Forgot password?" link to reset.'
                    }
                    else if (err.reason == 'Username already exists.') {
                        err.message = 'Email or cellphone number already exists.';
                    }

                    this.error = err;

                    this.isLoggedIn = false;
                    this.isAdmin = false;

                    let nada = [ ];
                    observer.next(nada);
                    observer.complete();

                } else {

                    console.log("!!!!!!!!!!!!!!!!!!!!! successfully returned from Meteor.loginWithPassword call.. !!!!!!!!!!!!!");
                    this.isLoggedIn = true;
                    this.reactiveLogin.next(true);

                    // Call alanning:roles from server - not reliable when calling from client
                    // this.isAdmin = Roles.userIsInRole( Meteor.userId(), 'superadmin');
                    Meteor.call('checkRoles', Meteor.userId(), (error, res) => {
                        if (error) {
                            this.isAdmin = false;
                            this.reactiveAdminLogin.next(false);
                            this.reactiveContractorLogin.next(false);
                            this.reactiveLeadContractorLogin.next(false);
                        }
                        else {
                            console.log('isAdmin from server 2 = ');                            
                            console.log(res);
                            
                            this.isAdmin = res.admin
                            this.reactiveAdminLogin.next(res.admin);
                            
                            this.isContractor = res.contractor;
                            this.reactiveContractorLogin.next(res.contractor);
    
                            this.isLeadContractor = res.leadContractor;                        
                            this.reactiveLeadContractorLogin.next(res.leadContractor);
    
                            console.log('isAdmin from server = ' + res.admin + ' == isContractor = ' + res.contractor + ' == isLeadContractor = ' + res.leadContractor );
                        }
                    });


                    // res is empty but I'm not using
                    observer.next(res);
                    observer.complete();
                }

            });
        });
    }


    logout() {
        this.isLoggedIn = false;
        this.isAdmin = false;
        this.reactiveLogin.next(false);
        this.reactiveAdminLogin.next(false);
        this.reactiveContractorLogin.next(false);
        this.reactiveLeadContractorLogin.next(false);
        
    }


    getReactiveLogin() {
        return this.reactiveLogin;
    }
    getReactiveAdminLogin() {
        return this.reactiveAdminLogin;
    }
    getReactiveContractorLogin() {
        return this.reactiveContractorLogin;
    }
    getReactiveLeadContractorLogin() {
        return this.reactiveLeadContractorLogin;
    }
}



