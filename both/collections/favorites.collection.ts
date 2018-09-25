import { MongoObservable } from 'meteor-rxjs';
import { Favorite } from '../models/favorite.model';
export const Favorites = new MongoObservable.Collection<Favorite>('favorites');

// Deny all client-side updates on the Favorites collection
Favorites.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

