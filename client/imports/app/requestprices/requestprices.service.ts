import { Meteor } from 'meteor/meteor';
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { Price  } from '../../../../both/models/price.model';
import { RequestPrice } from '../../../../both/models/requestprice.model';

import { VariablesService } from '../services/VariablesService';


/**
 * Logic is similar to requestnew-item except that item already exist
 *
 */

@Injectable()
export class RequestpricesService {

    requestObvs: Object = {};
    private combined$: Observable<any[]>;

    constructor(
        public _varsService: VariablesService) { }


    /**
     *
     * Add new Price and Requestprice for selected Quantity, Item, Store
     * Confirm Price doesn't exist
     *
     * If we have multiple storeIds - p and rp contain the latest storeId within all scopes - async issue
     * Therefor, we need to pass in storeId  (keep storeId separate)
     */
    requestpricesInsertPriceX(p: Price, rp: RequestPrice, storeList: Array) {

        this._varsService.errors['errors'] = '';
        // this._varsService.errors['errors'] = 'Force error message to display';

        if (storeList.length > 5) {

            return new Observable.create(observer => {
                this._varsService.errors['errors'] = this._varsService.msgs['max_store_error'];

                observer.next({
                    status: false,
                    error: this._varsService.msgs['max_store_error']

            });
                observer.complete();
            });
        }


        let cnt = 0;
        storeList.map(x => {
            this.requestObvs[cnt] = new Observable.create(observer => {
                Meteor.call('ddp.requestprices.insert.price.x', p, rp, x.storeId, (err, res) => {
                    if (err) {
                        this._varsService.errors['errors'] = err;
                        console.error("!!!!!!!! ERROR ON: requestprices.insert.price.x ..... !!!!!!!!!");

                        observer.next({
                            status: false,
                            error: err
                        });
                        observer.complete();

                    }
                    else {
                        if (!res.status) {
                            this._varsService.errors['errors'] = res.error;
                            console.error('requestprices.insert.price.x - ' + res.error);
                            observer.next(res);
                            observer.complete();
                        }
                        else {
                            // success!
                            console.warn("SUCCESSFULLY INSERTED NEW REQUEST PRICE... " + res.id );
                            observer.next(res);
                            observer.complete();
                        }
                    }
                });
            });

            cnt++;

            return x.storeId;
        });


        if (storeList.length == 1) {
            this.combined$ = this.requestObvs[0];
        }
        else if (storeList.length == 2) {
            this.combined$ = Observable.combineLatest(this.requestObvs[0], this.requestObvs[1]);
        }
        else if (storeList.length == 3) {
            this.combined$ = Observable.combineLatest(this.requestObvs[0], this.requestObvs[1], this.requestObvs[2]);
        }
        else if (storeList.length == 4) {
            this.combined$ = Observable.combineLatest(this.requestObvs[0], this.requestObvs[1], this.requestObvs[2], this.requestObvs[3]);
        }
        else if (storeList.length == 5) {
            this.combined$ = Observable.combineLatest(this.requestObvs[0], this.requestObvs[1], this.requestObvs[2], this.requestObvs[3], this.requestObvs[4]);
        }

        return this.combined$;
    }


}

