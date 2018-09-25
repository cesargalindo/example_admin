import { MongoObservable } from 'meteor-rxjs';
import { Setting } from '../models/setting.model';
export const Settings = new MongoObservable.Collection<Setting>('settings');

// Deny all client-side updates on the Lists collection
Settings.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});