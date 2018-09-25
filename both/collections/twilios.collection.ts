import { MongoObservable } from 'meteor-rxjs';
import { Twilio } from '../models/twilio.model';
export const Twilios = new MongoObservable.Collection<Twilio>('twilios');

// Deny all client-side updates on the Twilio collection
Twilios.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

