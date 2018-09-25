import { MongoObservable } from 'meteor-rxjs';
import { Item } from '../models/item.model';
export const Items = new MongoObservable.Collection<Item>('items');

// Deny all client-side updates on the Items collection
Items.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

