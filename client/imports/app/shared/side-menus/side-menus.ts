import { Meteor } from 'meteor/meteor';
import { Component, OnInit }   from '@angular/core';
import { Router }  from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { Observable } from 'rxjs/Rx';

import template from './side-menus.html';

@Component({
    selector: 'side-menus',
    template
})
export class SideMenus implements OnInit {
    isAdmin: boolean;
    isLoggedIn: boolean;
    isContractor: boolean;
    isLeadContractor: boolean;
    isLocalhost: boolean = false;

    constructor(public _authService: AuthService,
                private router: Router) { }

    ngOnInit() {
        if (this._authService.isAdmin == undefined) {
            // Check every 0.3 seconds if isAdmin has been set, after 12 seconds stop timer subscription with take(40)
            let timer = Observable
                .timer(300,300)
                .take(40)
                .subscribe( t => {
                    console.log('Timer count: ' + t + ' isadmin= ' + this._authService.isAdmin);
                    if (this._authService.isAdmin != undefined) {
                        this.isLoggedIn = this._authService.isLoggedIn;
                        this.isAdmin = this._authService.isAdmin;
                        this.isContractor = this._authService.isContractor;                        
                        this.isLeadContractor = this._authService.isLeadContractor;                        
                        timer.unsubscribe();
                    }
                });
        }
        else {
            this.isLoggedIn = this._authService.isLoggedIn;
            this.isAdmin = this._authService.isAdmin;
            this.isContractor = this._authService.isContractor;
        }


        // Monitor reactiveLogin using an Observable subject
        let reactiveLogin  =  this._authService.getReactiveLogin();
        reactiveLogin.subscribe(x => {
            if (x) {
                this.isLoggedIn = true;
            }
            else {
                this.isLoggedIn = false;
            }
        });


        // Monitor reactiveAdminLogin using an Observable subject
        let reactiveAdminLogin  =  this._authService.getReactiveAdminLogin();
        reactiveAdminLogin.subscribe(x => {
            console.warn('=====> reactiveAdminLogin fired off in header.menus <======== ' + x);
            console.warn(x);
            if (x) {
                this.isAdmin = x;
            }
            else {
                this.isAdmin = false;
            }
        });

        // Monitor reactiveAdminLogin using an Observable subject
        let reactiveContractorLogin  =  this._authService.getReactiveContractorLogin();
        reactiveContractorLogin.subscribe(x => {
            console.warn('=====> reactiveContractorLogin fired off in header.menus <======== ' + x);
            console.warn(x);
            if (x) {
                this.isContractor = x;
            }
            else {
                this.isContractor = false;
            }
        });


        // Monitor reactiveAdminLogin using an Observable subject
        let reactiveLeadContractorLogin  =  this._authService.getReactiveLeadContractorLogin();
        reactiveLeadContractorLogin.subscribe(x => {
            console.warn('=====> reactiveLeadContractorLogin fired off in header.menus <======== ' + x);
            console.warn(x);
            if (x) {
                this.isLeadContractor = x;
            }
            else {
                this.isLeadContractor = false;
            }
        });

        // Check if running locally
        if (Meteor.absoluteUrl().includes("localhost:")) {
            this.isLocalhost = true;
        }

    }


    logout() {
        Meteor.logout();
        this._authService.logout();
        this.router.navigate(['/']);
    }

}
