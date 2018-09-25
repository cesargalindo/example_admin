import { MongoObservable } from 'meteor-rxjs';
import { Ledger } from '../models/ledger.model';
export const Ledgers = new MongoObservable.Collection<Ledger>('ledgers');

// Deny all client-side updates on the Ledgers collection
Ledgers.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

