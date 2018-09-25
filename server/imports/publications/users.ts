import { Meteor } from 'meteor/meteor';


// Using in client for QueryOne.ts
Meteor.publish("allUsers", function () {
    return Meteor.users.find({});
});


Meteor.publish('users.currentUser', function() {

    return Meteor.users.find();

});