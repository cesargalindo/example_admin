import { MongoObservable } from 'meteor-rxjs';
import { SubmitPrice } from '../models/submitprice.model';
export const SubmitPrices = new MongoObservable.Collection<SubmitPrice>('submitprices');

// Deny all client-side updates on the SubmitPrices collection
SubmitPrices.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});