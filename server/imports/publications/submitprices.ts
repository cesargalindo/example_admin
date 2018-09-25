import { Meteor } from 'meteor/meteor';
import { SubmitPrices } from '../../../both/collections/submitprices.collection';
import { Counts } from 'meteor/tmeasday:publish-counts';

Meteor.publish('submitprices', function(options: Object) {
    if (!this.userId) {
        return this.ready();
    }

    Counts.publish(this, 'numberOfSubmits', SubmitPrices.collection.find({ }), { noReady: true });

    let ff = SubmitPrices.find({ }, options);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER submitprices ###################### ==> " + ff.cursor.count());
    return ff;
});

