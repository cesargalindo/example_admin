import { Meteor } from 'meteor/meteor';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { VariablesService } from '../../services/VariablesService';


import template from './top-toolbar.html';

/**
 * Search and Select stores component
 * Results are outputted to storeList array
 *
 */
@Component({
    selector: 'top-toolbar',
    template,
    inputs: ['SIDENAV'],

})
export class TopToolbarComponent implements OnInit {
    email: string;
    isLoggedIn: boolean = false;
    SIDENAV: any;

    showTopToolbar: boolean = true;
    reactiveTitle: String = 'Home';

    constructor(
        public _varsService: VariablesService,
        private _authService: AuthService) {
    }

    setCustomLocation() {
        alert("WIP");
    }
    isCurrent(pageName:string) {
        if (pageName.toLowerCase() == this.reactiveTitle.toLowerCase()) {
            return {'color': 'red'}
        }
    }

    ngOnInit() {
        this.isLoggedIn = this._authService.isLoggedIn;

        // Monitor reactiveLogin using an Observable subject
        let reactiveHideToolbar  =  this._varsService.getReactiveHideToolbar();
        reactiveHideToolbar.subscribe(x => {
            if (x) {
                this.showTopToolbar = false;
            }
            else {
                this.showTopToolbar = true;
            }
        });

        // Monitor reactive Title name using an Observable subject
        let reactiveHideTitle =  this._varsService.getReactiveTitleName();
        reactiveHideTitle.subscribe(x => {
            this.reactiveTitle = x;

            console.log(Meteor.user());
            
        });


        // Monitor reactiveLogin using an Observable subject
        let reactiveLogin  =  this._authService.getReactiveLogin();
        reactiveLogin.subscribe(x => {
          console.warn('######## reactiveLogin fired off in app.component ########');
          console.warn(x);
          if (x) {
            this.isLoggedIn = true;
            this.email = Meteor.user().emails[0].address;
          }
          else {
            this.isLoggedIn = false;
            this.email = '';
          }
        });


    }



}

