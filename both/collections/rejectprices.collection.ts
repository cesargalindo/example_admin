import { MongoObservable } from 'meteor-rxjs';
import { RejectPrice } from '../models/rejectprice.model';
export const RejectPrices = new MongoObservable.Collection<RejectPrice>('rejectprices');

// Deny all client-side updates on the RejectPrices collection
RejectPrices.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});