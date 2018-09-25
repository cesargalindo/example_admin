import { MongoObservable } from 'meteor-rxjs';
import { Issue } from '../models/issue.model';
export const Issues = new MongoObservable.Collection<Issue>('issues');

// Deny all client-side updates on the Issues collection
Issues.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});
