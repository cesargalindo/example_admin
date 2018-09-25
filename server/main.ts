import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
    // https://themeteorchef.com/tutorials/sign-up-with-email-verification
    Accounts.emailTemplates.siteName = "ZoJab - Admin";
    Accounts.emailTemplates.from     = "ZoJab Admin <no-reply@zojab.com>";

    // Add default settings to newly created user
    Accounts.onCreateUser((options, user) => {

        // insert default ranking
        user.ranking = {
            score: 10,
            downVotes: 0,
            upVotes: 10,
            thumbsUp: JSON.stringify({}),
            thumbsDown: JSON.stringify({})
        };
        user.withdrawalStatus = 0;
        user.submitStatus = 1;
        user.requestStatus = 1;
        user.cellVerified = false;

        user.settings = {
            payRequestDefault: 0.1,
            payRequestMax: 1,
            minHoursDefault: 12,
            minHoursMax: 120,
            quantityDefault: 1,
            quantityMax: 64
        };

        // return the new user object at the end!
        return user;
    });
});

import { loadUsers } from './imports/fixtures/load_users';
Meteor.startup(loadUsers);

import './imports/publications/users';
import './imports/publications/issues';
import './imports/publications/requestprices';
import './imports/publications/submitprices';
import './imports/publications/settings';
import './imports/slingshot/slingshot.init';
