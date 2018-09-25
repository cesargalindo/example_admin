import { Meteor } from 'meteor/meteor';
import { RequestPrices } from '../../../both/collections/requestprices.collection';
import { Counts } from 'meteor/tmeasday:publish-counts';

Meteor.publish('requestprices', function(options: Object) {
    if (!this.userId) {
        return this.ready();
    }

    Counts.publish(this, 'numberOfRequests', RequestPrices.collection.find({ }), { noReady: true });

    let ff = RequestPrices.find({ }, options);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER requestprices ###################### ==> " + ff.cursor.count());
    return ff;
});

