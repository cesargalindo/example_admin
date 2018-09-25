import { MongoObservable } from 'meteor-rxjs';
import { Price } from '../models/price.model';
export const Prices = new MongoObservable.Collection<Price>('prices');

// Deny all client-side updates on the Prices collection
Prices.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

