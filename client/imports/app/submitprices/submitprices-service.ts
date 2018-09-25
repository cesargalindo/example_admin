import { Meteor } from 'meteor/meteor';
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { Price  } from '../../../../both/models/price.model';
import { SubmitPrice } from '../../../../both/models/submitprice.model';

import { VariablesService } from '../services/VariablesService';

/**
 * Logic is similar to requestnew-item except that item already exist
 *
 */

@Injectable()
export class SubmitpricesService {

    submitObvs: Object = {};
    private combined$: Observable<any[]>;
    errors: Object;

    constructor(public _varsService: VariablesService) { }

    /**
     *
     * Add new Price and SubmitPrice for selected Quantity, Item, Store
     * Confirm Price doesn't exist
     *
     * If we have multiple storeIds - p and rp contain the latest storeId within all scopes - async issue
     * Therefor, we need to pass in storeId  (keep storeId separate)
     */
    submitpricesInsertPriceX(p: Price, sp: SubmitPrice, storeList: Array) {

        this._varsService.errors['errors'] = '';

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
                this.submitObvs[cnt] = new Observable.create(observer => {

                    Meteor.call('ddp.submitprices.insert.price.x', p, sp, x.storeId, (err, res) => {

                        if (err) {
                            this._varsService.errors['errors'] = err;
                            console.error("!!!!!!!! ERROR ON: submitprices.insert.price.x ..... !!!!!!!!!");
                            console.error(err);
                            observer.next({
                                status: false,
                                error: err
                            });
                            observer.complete();
                        }
                        else {
                            if (!res.status) {
                                this._varsService.errors['errors'] = res.error;
                                console.error('submitprices.insert.price.x - ' + res.error);
                                observer.next(res);
                                observer.complete();
                            }
                            else {
                                // success!
                                console.warn("SUCCESSFULLY INSERTED NEW SUBMIT PRICE... " + res.id );
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
                this.combined$ = this.submitObvs[0];
            }
            else if (storeList.length == 2) {
                this.combined$ = Observable.combineLatest(this.submitObvs[0], this.submitObvs[1]);
            }
            else if (storeList.length == 3) {
                this.combined$ = Observable.combineLatest(this.submitObvs[0], this.submitObvs[1], this.submitObvs[2]);
            }
            else if (storeList.length == 4) {
                this.combined$ = Observable.combineLatest(this.submitObvs[0], this.submitObvs[1], this.submitObvs[2], this.submitObvs[3]);
            }
            else if (storeList.length == 5) {
                this.combined$ = Observable.combineLatest(this.submitObvs[0], this.submitObvs[1], this.submitObvs[2], this.submitObvs[3], this.submitObvs[4]);
            }


            return this.combined$;
    }





}