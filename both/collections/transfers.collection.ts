import { MongoObservable } from 'meteor-rxjs';
import { Transfer } from '../models/transfer.model';
export const Transfers = new MongoObservable.Collection<Transfer>('transfers');

// Deny all client-side updates on the Transfers collection
Transfers.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

