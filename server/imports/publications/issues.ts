import { Meteor } from 'meteor/meteor';
import { Issues } from '../../../both/collections/issues.collection';
import { Counts } from 'meteor/tmeasday:publish-counts';

Meteor.publish('issues', function(options: Object) {
    if (!this.userId) {
        return this.ready();
    }

    Counts.publish(this, 'numberOfIssues', Issues.collection.find({ }), { noReady: true });

    let ff = Issues.find({ }, options);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ SERVER Issues ###################### ==> " + ff.cursor.count());
    return ff;
});

