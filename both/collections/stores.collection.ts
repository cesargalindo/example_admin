import { MongoObservable } from 'meteor-rxjs';
import { Store } from '../models/store.model';
export const Stores = new MongoObservable.Collection<Store>('stores');

// Deny all client-side updates on the Stores collection
Stores.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

