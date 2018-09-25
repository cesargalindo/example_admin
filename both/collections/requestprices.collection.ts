import { MongoObservable } from 'meteor-rxjs';
import { RequestPrice } from '../models/requestprice.model';
export const RequestPrices = new MongoObservable.Collection<RequestPrice>('requestprices');

// Deny all client-side updates on the RequestPrices collection
RequestPrices.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});