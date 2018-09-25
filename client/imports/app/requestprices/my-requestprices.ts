import { Component, NgZone, OnInit } from '@angular/core';
import { ActivatedRoute, Router }  from '@angular/router';
import { Angular2Apollo, ApolloQueryObservable } from 'angular2-apollo';
import { Observable } from 'rxjs/Rx';

import { RequestPrice } from '../../../../both/models/requestprice.model';
import { Item } from '../../../../both/models/item.model';
import { Price } from '../../../../both/models/price.model';
import { Store } from '../../../../both/models/store.model';
import { RequestPriceProcess } from '../../../../both/models/helper.models';

import { FormGroup, FormBuilder } from '@angular/forms';
import { UserService } from '../services/UserService';
import { CacheStateService } from '../services/CacheStateService';
import { VariablesService } from '../services/VariablesService';
import { SnackbarService } from '../services/SnackbarService';

import gql from 'graphql-tag';

import template from "./my-requestprices.html";

@Component({
    selector: 'my-requestprices',
    template,
})
export class MyRequestpricesComponent implements OnInit {
    currentDate: number;

    apolloRequestprices: ApolloQueryObservable<any>;
    apolloRequestpricesCount: ApolloQueryObservable<any>;

    total: number;
    pageSize: number = 5;
    p: number = 1;
    dateOrder: number = -1;

    userSearchFrom: FormGroup;
    usersList: Observable<Array<Object>>;

    userId: string;
    email: string;
    display_spinner: boolean = false;

    status: number = 999999;       // returns all values

    constructor(
        public _snackbar: SnackbarService,
        public _varsService: VariablesService,
        private formBuilder: FormBuilder,
        private apollo: Angular2Apollo,
        private _cacheState: CacheStateService,
        private route: ActivatedRoute,
        private router: Router,
        private _usersearch: UserService,
        private _ngZone: NgZone) { }


    ngOnInit() {
        this._varsService.setReactiveTitleName('REQUESTS');

        // show top toolbar
        this._varsService.setReactiveHideToolbar(false);

        // Monitor reactiveLogin using an Observable subject
        let reactiveError  =  this._varsService.getReactiveError();
        reactiveError.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (x) {
                    this._snackbar.displaySnackbar(1);
                }
            });
        });

        this.userSearchFrom = this.formBuilder.group({
            value: [ '' ]
        });

        // Search for user
        this.usersList = this.userSearchFrom.valueChanges
            .debounceTime(400)
            .distinctUntilChanged()
            .switchMap(term => this._usersearch.userEmailSearch(term.value))
            .do( x=> {
                console.log(x);
                return x;
            });


        // TODO - provide option pull user from URL path userID
        this.route.params.subscribe((params) => {
            if (params['userId'] != undefined) {
                // Load Requestprices Count -- it should always return before RequestPrices data
                this.userId = params['userId'];
            }
        });


        // Retrieve cached user
        let cachedUserInfo = this._cacheState.getSelectedUser('my_requestprices');
        if (cachedUserInfo.id) {
            this.userId = cachedUserInfo.id;
            this.email = cachedUserInfo.email;

            // Retrieve data for cached user on new page view
            this.getMyRequestpricesCount();

            // load initial page
            this.getMyRequestprices(this.p);
        }

    }


    /**
     * Retrieve My Request prices for selected user
     *
     * @param user 
     */
    SelectUser(user) {
        console.log(user.emails[0].address + ' -- ' + user._id);
        this.userId = user._id;
        this.email = user.emails[0].address;
        this._cacheState.updateSelectedUser('my_requestprices', this.userId, this.email);

        this.getMyRequestpricesCount();

        // load initial page
        this.getMyRequestprices(this.p);
    }


    getMyRequestpricesCount() {
          this.apolloRequestpricesCount = this.apollo.watchQuery({
              query: gql`
                  query RequestpricesCount($ownerId: String, $status: Int) {
                    apRequestpricesCount(ownerId: $ownerId, status: $status) {
                      count
                    }
                  }
                `,
              variables: {
                  ownerId: this.userId,
                  status: this.status
              },
              fetchPolicy: 'network-only'
          })
              .map( x => {
                  // console.log(x.data);
                  this.total = x.data.apRequestpricesCount.count;
              });
    }

    /**
     * 
     * @param page 
     */
    getMyRequestprices(page) {
        this.p = page;
        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {updated: this.dateOrder},
        };

        let serializeOptions = JSON.stringify(options);

        console.log(serializeOptions);

        this.apolloRequestprices = this.apollo.watchQuery({
            query: gql`
              query MyRequestprices($ownerId: String, $options: String, $status: Int) {
                apRequestprices(ownerId: $ownerId, options: $options, status: $status) {
                    _id
                    priceId
                    owner
                    payRequest
                    priceFactor
                    requestedAt
                    expiresAt
                    updated
                    status
                    note
                    paidTos {
                        spId
                        owner
                        paidAt
                        payout
                        status
                        submitpriceT {
                            _id
                            price
                        }
                    }
                    priceT2 {
                        itemId
                        storeId
                        price
                        quantity
                        itemT {
                            name
                            size
                            image
                        }
                        storeT {
                            name
                            address
                            locationT {
                                lat
                                lng
                            }
                        }
                    }
                }
              }
            `,
            variables: {
                ownerId: this.userId,
                options: serializeOptions,
                status: this.status
            },
            fetchPolicy: 'network-only'
        })
            .map( ({ data }) => {
                console.log(data);

                return data.apRequestprices;
            });

    }


    editRequestPrice(rp) {
        // Allow user to edit only if status = 1
        if (rp.status == 1) {
            this.router.navigate(['/requestprices-edit', { priceId: rp.priceId, requestId: rp._id }]);
        }
    }

    cancelRequestPrice(rp) {
        if (rp.status == 1) {
            this.router.navigate(['/requestprices-edit', { priceId: rp.priceId, requestId: rp._id, cancel: true }]);
        }
    }

    editRequestPriceNew(rp) {
        // Allow user to edit only if status = 9
        if (rp.status == 9) {
            this.router.navigate(['/requestprices-p', { priceId: rp.priceId, requestId: rp._id }]);
        }
    }

    cancelRequestPriceNew(rp) {
        if (rp.status == 9) {
            this.router.navigate(['/requestprices-p', {priceId: rp.priceId, requestId: rp._id, cancel: true}]);
        }
    }

    approveRequestPriceNew(rp) {
        if (rp.status == 9) {

            let currentDate = new Date().getTime();

            let pa = <Price>{};
            pa.price = rp.priceT2.price;
            pa.quantity = rp.priceT2.quantity;

            console.warn(pa);

            let ia = <Item>{};
            ia._id = rp.priceT2.itemId;
            ia.name = rp.priceT2.itemT.name;
            ia.size = rp.priceT2.itemT.size;
            ia.public = 1;
            ia.note = 'ddp-approve';

            console.warn(ia);

            let sa = <Store>{};
            sa._id = rp.priceT2.storeId;
            sa.location = {
                coordinates: [rp.priceT2.storeT.locationT.lat, rp.priceT2.storeT.locationT.lng],
                type: 'Point'
            };

            console.warn(sa);

            let ra = <RequestPrice>{};
            ra._id = rp._id;
            ra.priceId = rp.priceId;
            ra.payRequest = 1;
            ra.updated = currentDate;
            ra.expiresAt = currentDate;
            ra.note = 'update-new';
            ra.owner = rp.owner;
            ra.status = 1;

            // Push new Item onto Elesticsearch server so it's searchable "accessible" - set public = 1
            Meteor.call('parent.ddp.approve', pa, ia, sa, ra, (err, res) => {

                // this.display_spinner = false;

                if (err) {
                    console.error("!!!!!!!! ERROR: approveRequestPriceNew RequestPrices !!!!!!!!!");
                    console.error(err);
                    this._varsService.setReactiveError();
                    return;
                }
                else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: approveRequestPriceNew RequestPrices.update..." + res.error);
                        console.error(err);
                        this._varsService.setReactiveError();
                        return;
                    }
                    else {
                        console.log("SUCCESSFULLY UPDATED NEW Requestprice... ");
                        this.router.navigate(['/myrequestprices']);
                    }


                }
            });

        }
    }

    /**
     * 
     * @param info 
     * @param id 
     * @param owner 
     */
    RejectSubmittedPrice(info, id, owner) {

        this.display_spinner = true;

        alert('Your are rejecting this price - add Yes/NO to an Angular2 modal in future... ' + owner);

        let rpObject = new RequestPriceProcess();
        rpObject.id = id;
        rpObject.spId = info.spId;
        rpObject.userId = owner;            // validate this userId when updating

        console.log(rpObject);
        Meteor.call('ddp.requestpricesQueue.reject', rpObject, (err, res) => {

            this.display_spinner = false;

            if (err) {
                console.error("!!!!!!!! ERROR: RejectSubmittedPrice RequestPrices !!!!!!!!!");
                console.error(err);
                this._varsService.setReactiveError();
                return;
            }
            else {
                if (!res.status) {
                    console.error("!!!!!!!! ERROR ON: Reject price..." + res.error);
                    this._varsService.setReactiveError();
                    return;
                }
                else {
                    console.log('success -- cancelled request price - ' + info.priceId);
                    this.router.navigate(['/myrequestprices']);
                }
            }

        });

    }

}
