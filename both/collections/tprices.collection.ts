import { MongoObservable } from 'meteor-rxjs';
import { Tprice } from '../models/tprice.model';
export const Tprices = new MongoObservable.Collection<Tprice>('tprices');

// Deny all client-side updates on the Prices collection
Tprices.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

