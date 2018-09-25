import { Meteor } from 'meteor/meteor';
import { Component, OnInit, NgZone }   from '@angular/core';
import { Angular2Apollo } from 'angular2-apollo';
import { Observable } from 'rxjs/Observable';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router }  from '@angular/router';

import { VariablesService } from '../services/VariablesService';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/UserService';

import gql from 'graphql-tag';

import template from './my-tprices.html';

@Component({
    selector: 'my-tprices',
    template
})

export class MyTpricesComponent implements OnInit {
    pageSize: number = 50;

    asyncPrices: Observable<string[]>;
    thesePrices = [];

    p: number = 1;
    total: number;
    display_spinner: boolean = false;

    isAdmin: boolean = false;
    display_progress: boolean = false;
    progress_bar: number;

    error: string;
    success: string;

    usersFromForm: FormGroup;
    usersFrom: Observable<Array<Object>>;
    userEmailFrom: string;
    
    usersToForm: FormGroup;
    usersTo: Observable<Array<Object>>;
    userEmailTo: string;

    constructor(
        private apollo: Angular2Apollo,
        public _varsService: VariablesService,
        private _authService: AuthService, 
        private _userService: UserService,
        private formBuilder: FormBuilder,
        private router: Router,
        private _ngZone: NgZone) { }

    ngOnInit() {
        this._varsService.setReactiveTitleName('MY PRICES');

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


        this.getPage(1);

        // display Skip option if user is admin
        this.isAdmin = this._authService.isAdmin;
    }

    getPage(page: number) {
        this.thesePrices = [];
        this.display_spinner = true;

        this.asyncPrices = this.getPageInfo(page);

        this.asyncPrices.subscribe(x => {

            console.warn(x);

            this._ngZone.run(() => { // run inside Angular2 world
                this.total = x.total;
                this.p = page;
                this.display_spinner = false;

                // copy item name into price.distance field
                let itemIds = x.pricesList.map(y => y.itemId);
                let serializedItemIds = JSON.stringify(itemIds);

                this.apollo.query({
                    query: gql`
                        query ItemsInfoQuery($serializedIds: String) {
                            apItemsByIds(serializedIds: $serializedIds) {
                                _id
                                name
                                size
                                unit
                                image
                            }
                        }
                        `,
                    variables: {
                        serializedIds: serializedItemIds
                    }
                })
                .subscribe(({data}) => {
                    console.log('=========>> apItemsByIds result 00 <<========== ' + _.size(data)  + ' -- ' + _.size(data.apItemsByIds) );
                    let itemsArray = _.indexBy(data.apItemsByIds, '_id');
                    let i = 0;
                    // hijacked price fields to display item information   
                    x.pricesList.map(y => {
                        x.pricesList[i].distance = itemsArray[y.itemId].name
                        x.pricesList[i].expiresAt = x.pricesList[i].price * x.pricesList[i].gsize;
                        x.pricesList[i].submitterId = itemsArray[y.itemId].size + ' ' + itemsArray[y.itemId].unit;
                        x.pricesList[i].image = itemsArray[y.itemId].image;
                        i++;
                    })

                    // pricesList now contains item name in distance field - copy over now
                    this.thesePrices =  x.pricesList;               
                });

            });

        })
    }


    getPageInfo(page) {

        let options = {
            limit: this.pageSize,
            skip: (page - 1) * this.pageSize,
        };

        let sort = {};
        sort['submittedAt'] = -1;

        return new Observable.create(observer => {
            // Retrieve matching prices - call mongoDB directly, avoid sub/pub
            Meteor.call('getMyTprices', options, sort, this.userEmailFrom, (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    observer.next(res);
                    observer.complete();
                }
            });
        });
    }


    processManualPrices() {
        if (this.isAdmin) {
            this.display_progress = true;
            this.progress_bar = 0;
            let timer = Observable
            .timer(1000,1000)
            .subscribe( t => {
                this.progress_bar = this.progress_bar  + 0.5;
            });

            Meteor.call('processManualPrices', this.userEmailFrom, (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    if (err) {
                        console.error("!!!!!!!! ERROR: processManualPrices !!!!!!!!!");
                        console.error(err);
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: processManualPrices...." + res.error);
                            return;
                        }
                        else {
                            console.log("SUCCESSFUL processManualPrices ...");
                            console.log(res.data);
                        }
                    }
                    timer.unsubscribe();
                    this.display_progress = false;
                });
            });
        }
    }

    applyFilter() {
        this.getPage(1);
    }

    editTprice(price) {
        console.warn(price)
        this._varsService.params = price;
        this.router.navigate(['/edit-tprice', { redirect: '/my-prices' }]);
    }


    /**
     * Delete selected tprice
     * 
     * @param price 
     */
    deleteTprice(price) {
        if (confirm("ARE YOU SURE - delete this price") == true) {
            var txt = "yes";

            Meteor.call('deleteTprice', price._id, 'skip', (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    if (err) {
                        console.error("!!!!!!!! ERROR: deleting tprice !!!!!!!!!");
                        console.error(err);
                    } else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: deleting tprice..." + res.error);
                        }
                        else {
                            console.log('Successfully deleted tprice: ' + price.name);
                            this.getPage(this.p);
                        }
                    }
                });
            });
        } else {
            var txt = "no";
        }
    }


    transferMyPricesOwnership() {
        this.error = '';
        this.success = '';
        
        if (confirm("ARE YOU SURE - transfer ownership") == true) {
            
            Meteor.call('myPricesUserTransfer', this.userEmailFrom, this.userEmailTo, (err, res) => {
                this._ngZone.run(() => { // run inside Angular2 world
                    this.display_spinner = false;
    
                    if (err) {
                        console.error("!!!!!!!! GO AN ERROR ON: transferMyPricesOwnership..... !!!!!!!!!");
                        console.error(err);
                        this.error = err;
                    }
                    else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: transferMyPricesOwnership ..... !!!!!!!!! == " + res.error);
                            console.error(err);
                            this.error = res.error;
                        }
                        else {
                            console.warn("SUCCESSFULLY INSERTED NEW transferMyPricesOwnership... " + res.status);
                            console.warn(res);
                            this.success = 'Successly transfered ' + res.count + ' items to new owner.';
                        }
                    }
    
                });
            });

        } 
    }


    selectFromUser(u) {
        this.userEmailFrom = u.emails[0].address;
        this.usersFromForm.patchValue({
            fromValue: u.emails[0].address
        });
    }

    selectToUser(u) {
        this.userEmailTo = u.emails[0].address;
        this.usersToForm.patchValue({
            toValue: u.emails[0].address
        });
    }

    
}

