import { Meteor } from 'meteor/meteor';

import { RequestPriceProcess } from '../../both/models/helper.models';
import { RequestPrice } from '../../both/models/requestprice.model';
import { SubmitPrice } from '../../both/models/submitprice.model';

import { Item } from '../../both/models/item.model';
import { Store } from '../../both/models/store.model';
import { Price } from '../../both/models/price.model';

import { infoModel } from '../functions/functions.admin.misc';
import { getUser } from '../functions/functions.admin.users';
import { itemsInsertElasticsearch, itemsUpdateElasticsearch, ddpItemsUpdate, ddpItemsInsertByAdmin } from '../functions/functions.admin.items';
import { requestpricesElasticsearchInsert } from '../functions/functions.admin.requestprices';

Meteor.methods({

    // ######################## PARENT DDP METHODS ######################

    /**
     * Approve Item - old logic, no longer used
     * 
     * @param pa 
     * @param ia 
     * @param sa 
     * @param ra 
     */
    'parent.ddp.approve'(pa: Price, ia: Item, sa: Store, ra: RequestPrice) {

        // Verify user is logged in
        if (Meteor.userId()) {

            // let resItem = Meteor.call('ddp.items.update', ia);           
            let resItem = ddpItemsUpdate(ia);                               
            
            if (!resItem.status) {
                return resItem;
            }

            // Function resides on Admin server - - add item info to Price index
            let resES = itemsInsertElasticsearch(ia);
            if (!resES.status) {
                return resES;
            }

            let resRP = Meteor.call('ddp.requestprices.update', ra);      //ff ??
            if (!resRP.status) {
                return resRP;
            }

            return requestpricesElasticsearchInsert(pa, ia, sa, ra);
        }
    },


    /**
     * Update item on client server by leveraging ddp
     * 
     * @param iu 
     * @param contractor 
     */
    'parent.ddp.items.update'(iu: Item, contractor: boolean) {
        // Verify user is logged in
        if (Meteor.userId()) {
            // let resItem = Meteor.call('ddp.items.update', iu);
            let resItem = ddpItemsUpdate(iu);           
        
            if (!resItem.status) {
                return resItem;
            }

            if (iu.note == undefined) {
                iu.note = '';
            }

            // If contractor editing - skip Elasticsearch -- remove note when item has been officially published - on elasticsearch
            if ( (contractor) || (iu.note == 'contractor') || iu.note.includes(':contractor') ) {
                return resItem;                
            }
            else {
                // Function resides on Admin server - - update item info in Elasticsearch
                return itemsUpdateElasticsearch(iu);
            }
        }

    },



    // ######################## SINGLE DDP CALLS ######################

    /**
     * sp.note is required
     * sp.note must equal 'submit-new' - only option
     * sp.status will be overriden by function calls within this method
     *
     * 
     * @param p 
     * @param sp 
     * @param storeId 
     */
    'ddp.submitprices.insert.price.x'(p: Price, sp: SubmitPrice, storeId: string) {
        // Verify user is logged in
        if (Meteor.userId()) {

            let clientConn = DDP.connect(Meteor.settings.DDP_URL);

            // Get Meteor userId
            let userInfo = getUser(Meteor.user().emails[0].address);
            console.warn('----------  ddp.submitprices.insert.price.x ========= ');

            // Make DDP call
            if (userInfo.status) {
                let ddpInfo = new infoModel('', '', '', '', '');
                ddpInfo.userId = userInfo.id;
                ddpInfo.adminKey = Meteor.settings.ADMIN_KEY;
                ddpInfo.ownerId = userInfo.id;

                let moo = clientConn.call('ddp.submitprices.insert.price.x', p, sp, storeId, ddpInfo);
                return moo;
            }
            else {
                return { status: false }
            }
        }
        else {
            return { status: false }
        }
    },


    /**
     * 
     * @param p 
     * @param rp 
     * @param storeId 
     */
    'ddp.requestprices.insert.price.x'(p: Price, rp: RequestPrice, storeId: string) {
        // Verify user is logged in
        if (Meteor.userId()) {

            let clientConn = DDP.connect(Meteor.settings.DDP_URL);

            // Get Meteor userId
            let userInfo = getUser(Meteor.user().emails[0].address);
            console.warn('----------  ddp.requestprices.insert.price.x ========= ');
            console.warn(userInfo);

            // Make DDP call
            if (userInfo.status) {
                let ddpInfo = new infoModel('', '', '', '', '');
                ddpInfo.userId = userInfo.id;
                ddpInfo.adminKey = Meteor.settings.ADMIN_KEY;
                ddpInfo.ownerId = userInfo.id;

                let moo = clientConn.call('ddp.requestprices.insert.price.x', p, rp, storeId, ddpInfo);
                return moo;
            }
            else {
                return { status: false }
            }
        }
        else {
            return { status: false }
        }
    },

    /**
     * 
     * @param uu 
     */
    'ddp.users.update'(uu: Object) {
        // Verify user is logged in
        if (Meteor.userId()) {

            let clientConn = DDP.connect(Meteor.settings.DDP_URL);

            // Get Meteor userId
            let userInfo = getUser(Meteor.user().emails[0].address);
            console.warn('----------  ddp.users.update ========= ' + uu.ownerId);
            console.warn(userInfo);

            // Make DDP call
            if (userInfo.status) {
                let ddpInfo = new infoModel('', '', '', '', '');
                ddpInfo.userId = userInfo.id;
                ddpInfo.adminKey = Meteor.settings.ADMIN_KEY;
                ddpInfo.ownerId = uu.ownerId;

                let moo = clientConn.call('ddp.users.update', uu, ddpInfo);
                return moo;
            }
            else {
                return { status: false }
            }
        }
        else {
            return { status: false }
        }
    },

    /**
     * 
     * @param rp 
     */
    'ddp.requestpricesQueue.reject'(rp: RequestPriceProcess) {
        // Verify user is logged in
        if (Meteor.userId()) {

            let clientConn = DDP.connect(Meteor.settings.DDP_URL);

            // Get Meteor userId
            let userInfo = getUser(Meteor.user().emails[0].address);
            console.warn('----------  ddp.requestpricesQueue.reject =========');
            console.warn(userInfo);

            // Make DDP call
            if (userInfo.status) {
                let ddpInfo = new infoModel('', '', '', '', '');
                ddpInfo.userId = userInfo.id;
                ddpInfo.adminKey = Meteor.settings.ADMIN_KEY;
                ddpInfo.ownerId = rp.userId;
                ddpInfo.id = rp.id;

                let moo = clientConn.call('ddp.requestpricesQueue.reject', rp, ddpInfo);
                return moo;
            }
            else {
                return { status: false }
            }
        }
        else {
            return { status: false }
        }
    },

    /**
     * 
     * @param rp 
     */
    'ddp.requestprices.update'(rp: RequestPrice) {
        // Verify user is logged in
        if (Meteor.userId()) {

            let clientConn = DDP.connect(Meteor.settings.DDP_URL);

            // Get Meteor userId
            let userInfo = getUser(Meteor.user().emails[0].address);
            console.warn('----------  ddp.requestprices.update =========');

            // Make DDP call
            if (userInfo.status) {
                let ddpInfo = new infoModel(userInfo.id, Meteor.settings.ADMIN_KEY , rp.owner);
                let moo = clientConn.call('ddp.requestprices.update', rp, ddpInfo);
                return moo;
            }
            else {
                return { status: false }
            }

        }
        else {
            return { status: false }
        }
    },


    /**
     * Replicated Client App ddp call here locally
     * 
     * @param ii 
     * @param copy 
     */
    'ddp.items.insert.byAdmin'(ii: Item, copy: boolean) {
        // Verify user is logged in
        if (Meteor.userId()) {

            let res = ddpItemsInsertByAdmin(ii, copy);

            if (res.status) {
                return res;
            }
            else {
                return { status: false }
            }

        }
        else {
            return { status: false }
        }

    },

    /**
     * 
     * @param rp 
     */
    'ddp.requestprices.cancel'(rp: RequestPrice) {
        // Verify user is logged in
        if (Meteor.userId()) {

            let clientConn = DDP.connect(Meteor.settings.DDP_URL);

            // Get Meteor userId
            let userInfo = getUser(Meteor.user().emails[0].address);

            // Make DDP call
            if (userInfo.status) {
                let ddpInfo = new infoModel(userInfo.id, Meteor.settings.ADMIN_KEY , rp.owner);
                let moo = clientConn.call('ddp.requestprices.cancel', rp, ddpInfo);
                return moo;
            }
            else {
                return { status: false }
            }

        }
        else {
            return { status: false }
        }
    },

    /**
     * 
     * @param i 
     * @param p 
     * @param rp 
     */
    'ddp.requestprices.edit.price.item'(i: Item, p: Price, rp: RequestPrice) {
        // Verify user is logged in
        if (Meteor.userId()) {

            let clientConn = DDP.connect(Meteor.settings.DDP_URL);

            // Get Meteor userId
            let userInfo = getUser(Meteor.user().emails[0].address);

            // Make DDP call
            if (userInfo.status) {
                let ddpInfo = new infoModel(userInfo.id, Meteor.settings.ADMIN_KEY , rp.owner);
                let moo = clientConn.call('ddp.requestprices.edit.price.item', i, p, rp, ddpInfo);
                return moo;
            }
            else {
                return { status: false }
            }

        }
        else {
            return { status: false }
        }
    },


});