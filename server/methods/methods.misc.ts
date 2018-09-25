import { Meteor } from 'meteor/meteor';

import { Setting } from "../../both/models/setting.model";
import { Settings } from "../../both/collections/settings.collection";

Meteor.methods({

    /**
     *  check if AWS image is available
     *
     * @param link1 
     */
    'checkValidImage'(link1: string) {
        check(link1, String);

        if (this.userId) {
            try {
                HTTP.call('GET', link1, {});
                console.log('SUCCESS AWS IMAGE EXIST... ' + link1);
                return true;
            }
            catch (err) {
                // console.log(err);
                return false;
            }
        }
    },

    /**
     * 
     * @param sett 
     */
    'insertUpdateSettings'(sett: Setting) {
        if ( (this.userId) && (Roles.userIsInRole(Meteor.userId(), 'superadmin')) ) {

            // confirm bacode doesn't already exist in system
            let it = Settings.find({
                chainName: sett.chainName
            }).fetch();

            let currentDate = new Date().getTime();

            // Settings entry exist in ZoJab's Admin db 
            if (it.length) {

                Settings.update(it[0]._id, {
                    $set: {
                        scrapedAt: sett.scrapedAt,
                        pricedAt: sett.pricedAt,
                        updateAt: currentDate,
                    }
                }).subscribe(
                    z => {
                        console.log('Update count: ' + z);
                    },
                    err => {
                        console.error(err);
                    }
                );

                return {
                    id: it[0]._id,
                    status: true
                };

            }
            else {
                sett.updateAt = currentDate;
                Settings.insert(sett).subscribe(
                    x => {
                        console.log('true id here = ' + x);
                    },
                    err => {
                        console.error(err);
                    }
                );

                return { true: true };
            }



        }

    },




});