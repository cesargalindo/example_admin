import { MongoObservable } from 'meteor-rxjs';
import { Vote } from '../models/votes.model';
export const Votes = new MongoObservable.Collection<Vote>('votes');

// Deny all client-side updates on the Votes collection
Votes.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

