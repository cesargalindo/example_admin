import { Injectable } from '@angular/core';
import { Snapshots } from '../../../../both/collections/snapshots.local.collection';
import { snapshot } from '../../../../both/models/snapshot.model';

import NodeCache = require('node-cache')


/**
 * Leverage Meteor collection "snapshot" to store Search settings states
 *
 * intializeSnapshots() is only called once on first load app.component.ts
 *
 * Snapshot info is persisted in localStorage and loaded into a Meteor local collection
 * Meteor collection "snapshot" reactivity is leverage in various places of app
 *
 *
 * localStorage.clear();    <-- clear local storage
 *
 */
@Injectable()
export class CacheStateService {
    snap: snapshot;
    reRunSearchCache: boolean = false;
    newPriceEntryInserted: boolean = false;
    newPriceEntryType: string;
    
    cacheManager: any;

    constructor() { }

    intializeSnapshots() {

        console.warn("------------------- intializeSnapshots ------------------");

        this.cacheManager = new NodeCache( { stdTTL: Meteor.settings.public.REQUESTPRICES_TTL } );

        // Initialize SELECTED-USER on first app load -  Used by admin client only
        this.snap = this.tryLoadFromStorage('SELECTED-USER');
        if ( !_.size(this.snap) ) {
            this.snap = {};
            this.snap._id = 'SELECTED-USER';
            this.snap.selectedUser = {};
            this.snap.selectedUser.my_requestprices = {};
            this.snap.selectedUser.my_requestprices.id = '';
            this.snap.selectedUser.my_requestprices.email = '';
            this.snap.selectedUser.my_submitprices = {};
            this.snap.selectedUser.my_submitprices.id = '';
            this.snap.selectedUser.my_submitprices.email = '';
            this.saveToStorage('SELECTED-USER', this.snap);
        }
        Snapshots.insert(this.snap);


        // Initialize REQUEST-SEARCH-SETTINGS on first app load
        this.snap = {};
        this.snap._id = 'REQUEST-SEARCH-SETTINGS';
        this.snap.reRunSearch = false;
        Snapshots.insert(this.snap);

        this.snap = {};
        this.snap._id = 'SUBMIT-SEARCH-SETTINGS';
        this.snap.reRunSearch = false;
        Snapshots.insert(this.snap);
    }


    saveToStorage(storageKey, info) {
        localStorage.setItem(storageKey, JSON.stringify(info));
    }

    tryLoadFromStorage(storageKey) {
        let loc = localStorage.getItem(storageKey);
        if (loc != null)
        {
            console.log("Got location from storage: " + loc);
            return JSON.parse(loc);
        }
        else
        {
            console.warn('saveToStorage is required .... ' + storageKey);
            return {};
        }
    }


    /**
     * Set the cache to record when the last refetch occurred
     * After cache expires, is time for Apollo to refetch again
     *
     */
    apolloRefetchCacheSet(component) {
        this.cacheManager.set(component, {refetch: false});
    }

    /**
     * Set the cache to record when the last refetch occurred
     * After cache expires, is time for Apollo to refetch again
     *
     */
    apolloRefetchCacheGet(component) {
        // checking
        let value = this.cacheManager.get(component);

        if (value == undefined) {
            // last cache has expired - refetch Apollo query again
            return true;
        }
        else {
            // catch is still active - do not refectch
            return false;
        }
    }


    /**
     * Flush the cache by deleting it
     *
     */
    apolloRefetchCacheDel(components) {

        this.cacheManager.del( components, function( err, count ) {
            if( err ) {
                console.error('Got a cache delete error. Count: ' + err);
                alert('Got a cache delete error. ' +  err);
            }
        });

    }


    /**
     * Force a new ss2 search when visiting landing page
     * Rerun occurs in elasticsearch-ss2
     *
     */
    forceFullsearchRerun() {
        this.reRunSearchCache = true;
    }

    checkFullsearchRerun() {
        if (this.reRunSearchCache) {
            this.reRunSearchCache = false;
            return true;
        }
        else {
            return false;
        }
    }


    /**
     * use to capture action of a Request or Submit that contain a newly inserted price
     * Client app will bypass making data call to server to avoid delay of new data making into Elasticsearch, Mongo, and GraphQL
     */
    setNewPriceEntryInserted(val, type) {
        this.newPriceEntryInserted = val;
        this.newPriceEntryType = type;
    }
    checkNewPriceEntryInserted() {
        return this.newPriceEntryInserted;
    }
    checkNewPriceEntryType() {
        return this.newPriceEntryType;
    }

    // ############## Admin Server only functions #############

    /**
     * Admin Server only functions
     */
    getSelectedUser(component) {
        this.snap = Snapshots.findOne('SELECTED-USER');
        return this.snap.selectedUser[component];
    }


    updateSelectedUser(component, id, email) {
        this.snap = Snapshots.findOne('SELECTED-USER');
        this.snap.selectedUser[component].id = id;
        this.snap.selectedUser[component].email = email;
        console.log(this.snap);
        Snapshots.update('SELECTED-USER', this.snap);
    }


}

