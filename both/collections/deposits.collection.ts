import { MongoObservable } from 'meteor-rxjs';
import { Deposit } from '../models/deposit.model';
export const Deposits = new MongoObservable.Collection<Deposit>('deposits');

// Deny all client-side updates on the Deposits collection
Deposits.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

