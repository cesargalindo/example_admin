import { MongoObservable } from 'meteor-rxjs';
import { ScrapeItem } from '../models/scrapeitem.model';
export const ScrapeItems = new MongoObservable.Collection<ScrapeItem>('scrapeitems');

// Deny all client-side updates on the ScrapeItems collection
ScrapeItems.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});
