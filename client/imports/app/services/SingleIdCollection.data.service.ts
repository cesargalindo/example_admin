import { Injectable } from "@angular/core";

import { RequestPrice } from "../../../../both/models/requestprice.model";
import { RequestPrices } from "../../../../both/collections/requestprices.collection";

import { SubmitPrices } from '../../../../both/collections/submitprices.collection';

import { Price } from "../../../../both/models/price.model";
import { Prices } from '../../../../both/collections/prices.collection';

import { Store } from "../../../../both/models/store.model";
import { Stores } from '../../../../both/collections/stores.collection';

import { Item } from "../../../../both/models/item.model";
import { Items } from '../../../../both/collections/items.collection';

import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class SingleCollectionService {

    private subRequestPrice: Subscription;
    private subSubmitPrice: Subscription;
    private subPrice: Subscription;
    private subPriceQuantity: Subscription;
    private subStore: Subscription;
    private subItem: Subscription;

    constructor() { }


    public getPrice(id): Observable<Price[]> {
        return new Observable.create(observer => {
            this.subPrice = MeteorObservable.subscribe('price', id).zone().subscribe();
            Prices.find({
                _id: id
            })
                .subscribe(x => {
                    observer.next(x);
                    observer.complete();
                });
        });
    }


    public getItem(id): Observable<Item[]> {
        return new Observable.create(observer => {
            this.subItem = MeteorObservable.subscribe('item', id).zone().subscribe();
            Items.find({
                _id: id
            })
                .subscribe(x => {
                    console.log(x);
                    observer.next(x);
                    observer.complete();
                });
        });
    }


    public getStore(id): Observable<Store[]> {
        return new Observable.create(observer => {
            this.subStore = MeteorObservable.subscribe('store', id).zone().subscribe();
            Stores.find({
                _id: id
            })
                .subscribe(x => {
                    console.log(x);
                    observer.next(x);
                    observer.complete();
                });
        });
    }


    public getRequestPrice(id): Observable<RequestPrice[]> {
        return new Observable.create(observer => {
            this.subRequestPrice = MeteorObservable.subscribe('myrequestprice', id).zone().subscribe();
            RequestPrices.find({
                _id: id
            })
                .subscribe(x => {
                    console.log(x);
                    observer.next(x);
                    observer.complete();
                });
        });

    }



}