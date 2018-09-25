import { Meteor } from 'meteor/meteor';
import { SubmitPrices } from '../../both/collections/submitprices.collection';
import { SubmitPrice } from '../../both/models/submitprice.model';

import { Issues } from '../../both/collections/issues.collection';
import { Issue } from '../../both/models/issue.model';

import { getUser } from '../functions/functions.admin.users';

let Future = Npm.require( 'fibers/future' );

Meteor.methods({


    /**
     * Update submit price which is saved in admin mongo DB
     * Cron job will pushed to Client server "app" once scheduled time is met
     * 
     * @param sp 
     */
    'submitprices.edit.schedule'(sp: SubmitPrice) {
        // Verify user is logged into Admin server
        if (this.userId) {

            // Create our future instance.
            let future = new Future();

            // Remove id from update query
            let spId = sp._id;
            sp = _.omit(sp,'_id');

            SubmitPrices.update(spId, {
                $set: sp
            }).subscribe(count => {

                if(!count) {
                    let xprice = <Issue>{};
                    xprice.severity = 'CRITICAL';
                    xprice.rpId = sp._id;
                    xprice.storeId = sp.storeId;
                    xprice.created = sp.updated;
                    xprice.note = 'submitprices.EDIT.schedule - ' + sp.note;
                    xprice.status = sp.status;
                    xprice.price = sp.price;
                    xprice.expiresAt = sp.scheduled;
                    xprice.pqId = Meteor.userId() + ' - ' + Meteor.user().emails[0].address;
                    Issues.insert(xprice);

                    future.return({
                        status: false,
                        error: 'requestprices.EDIT: unable to EDIT submitprice'
                    });
                }
                else {
                    future.return({
                        status: true,
                        spId: spId
                    });
                }

            });

            return future.wait();
        }

    },


    /**
     * Add request price which is saved in admin mongo DB
     * Cron job will pushed to Client server "app" once scheduled time is met
     * 
     * @param sp 
     */
    'submitprices.insert.schedule'(sp: SubmitPrice) {
        // Verify user is logged into Admin server
        if (this.userId) {

            // Create our future instance.
            let future = new Future();

            if ( (sp.status == '') || (sp.status == undefined)) {
                sp.status = 0;
            }

            let userInfo = getUser(Meteor.user().emails[0].address);
            sp.owner = userInfo.id;

            // Insert new Submitpice
            SubmitPrices.insert(sp)
                .subscribe(
                    x => {
                        console.log('true spId here = ' + x);
                        future.return({
                            status: true,
                            storeId: sp.storeId
                        });
                    },
                    err => {
                        console.log(err);

                        let xprice = <Issue>{};
                        xprice.severity = 'CRITICAL';
                        xprice.spId = sp._id;
                        xprice.storeId = sp.storeId;
                        xprice.created = sp.updated;
                        xprice.note = 'submitprices.insert.schedule - ' + sp.note;
                        xprice.status = sp.status;
                        xprice.requestPayout = 0;
                        xprice.price = sp.price;
                        xprice.priceFactor = sp.scheduled;
                        xprice.pqId = Meteor.userId() + ' - ' + sp.owner;
                        Issues.insert(xprice);

                        future.return({
                            status: false,
                            error: 'submitprices.insert.schedule: unable to insert price'
                        });
                    }
                );

            return future.wait();
        }

    },





});

