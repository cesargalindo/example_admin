import { MongoObservable } from 'meteor-rxjs';
import { PriceQueue } from '../models/pricequeue.model';
export const PriceQueues = new MongoObservable.Collection<PriceQueue>('pricequeues');

// Deny all client-side updates on the PriceQueues collection
PriceQueues.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

