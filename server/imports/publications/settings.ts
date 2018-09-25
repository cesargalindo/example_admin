import { Meteor } from 'meteor/meteor';
import { Settings } from '../../../both/collections/settings.collection';
import { Counts } from 'meteor/tmeasday:publish-counts';

Meteor.publish('settings', function() {
    if (!this.userId) {
        return this.ready();
    }

    Counts.publish(this, 'numberOfSettings', Settings.collection.find({ }), { noReady: true });

    let ff = Settings.find({ });
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER Settings ###################### ==> " + ff.cursor.count());
    return ff;
});

