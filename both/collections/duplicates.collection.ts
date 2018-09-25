import { MongoObservable } from 'meteor-rxjs';
import { ScrapeItem } from '../models/scrapeitem.model';
export const Duplicates = new MongoObservable.Collection<Duplicate>('duplicates');

// Deny all client-side updates on the Duplicates collection
Duplicates.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});
