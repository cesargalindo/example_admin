import { Meteor } from 'meteor/meteor';
import { Component, OnInit, NgZone }   from '@angular/core';
import { Angular2Apollo } from 'angular2-apollo';
import { Observable } from 'rxjs/Observable';
import { FormGroup, FormBuilder } from '@angular/forms';

import { VariablesService } from '../services/VariablesService';
import gql from 'graphql-tag';

import template from './prices-list.html';

@Component({
    selector: 'prices-list',
    template
})

export class PricesListComponent implements OnInit {
    pageSize: number = 50;

    asyncPrices: Observable<string[]>;
    thesePrices = [];

    p: number = 1;
    total: number;
    display_spinner: boolean = false;

    pricesForm: FormGroup;
    searchTerm: string = '';

    stortByForm = FormGroup;
    sortByValue: string;
    sortByLists: Array<any>;

    ascendingForm = FormGroup;
    ascendingValue: number;
    ascendingList: Array<any>;

    constructor(
        private apollo: Angular2Apollo,
        public _varsService: VariablesService,
        private formBuilder: FormBuilder,
        private _ngZone: NgZone) { }

    ngOnInit() {
        this._varsService.setReactiveTitleName('PRICES');

        this.pricesForm = this.formBuilder.group({
            value: ['']
        });

        this.pricesForm.valueChanges
            .debounceTime(300)
            .distinctUntilChanged()
            .subscribe(searchTerm => {
                if (searchTerm.value != undefined) {
                    this.searchTerm = searchTerm.value;
                }
                return searchTerm;
            });


        this.sortByLists = [
            {value: 'submittedAt', viewValue: 'submittedAt'},
            {value: 'updated', viewValue: 'updated'},
            {value: 'expiresAt', viewValue: 'expiresAt'},
            {value: 'price', viewValue: 'price'},
            {value: 'payoutRequest', viewValue: 'payoutRequest'}
        ];

        this.stortByForm = this.formBuilder.group({
            value: [ '' ]
        });

        this.sortByValue = 'submittedAt';

        this.ascendingList = [
            {value: 1, viewValue: 'Ascending'},
            {value: -1, viewValue: 'Descending'}
        ];

        this.ascendingForm = this.formBuilder.group({
            value: [ '' ]
        });

        this.ascendingValue = -1;


        this.getPage(1);
    }

    getPage(page: number) {
        this.thesePrices = [];
        this.display_spinner = true;

        this.asyncPrices = this.getPageInfo(page);

        this.asyncPrices.subscribe(x => {
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
        sort[this.sortByValue] = this.ascendingValue;

        return new Observable.create(observer => {
            // Retrieve matching prices - call mongoDB directly, avoid sub/pub
            Meteor.call('getPricesNew', options, sort, this.searchTerm, (error, res) => {
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


    applyFilter() {
        this.getPage(1);
    }


}

