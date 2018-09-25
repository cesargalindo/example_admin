import { Meteor } from 'meteor/meteor';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class UserService {

    score: number;
    downVotes: number;
    upVotes: number;
    thumbsUp: Object;
    thumbsDown: Object;
    reactiveRanking: Subject<Object> = new Subject<Object>();

    userProfile: Object = {};
    cellVerified: boolean;

    userBalance: number;
    userPendingRequests: number;
    userPendingSubmits: number;
    totalBalance: number;

    withdrawalStatus: number;
    submitStatus: number;
    requestStatus: number;

    payRequestDefault: number;
    payRequestMax: number;
    minHoursDefault: number;
    minHoursMax: number;
    quantityDefault: number;
    quantityMax: number;

    scheduledTimestamp: number = new Date().getTime();
    scheduledDate: Date;
    scheduledHour: number = 2;
    scheduledMinute: number = 2;

    storeId: string;
    storeName: string;
    storeAddress: string;

    contractorIds: Array<any>;
    // Use these variable to save search history for contractor items
    done: number;
    sortBy: string;
    searchName: string;
    overrideSkip: boolean;

    skip: number;
    total: number;
    storeChain: string;

    constructor(
        private _ngZone: NgZone) {
    }

    /**
     * Used by Admin server
     */
    userEmailSearch(term: string) {

        return new Observable.create(observer => {

            if (term) {
                // ensure search term is greater than 1 characters..
                if (term.length < 2) {
                    let nada = [ ];
                    observer.next(nada);
                    observer.complete();
                }
                else {
                    Meteor.call('getUserEmails', term, (error, res) => {

                        this._ngZone.run(() => {
                            if (error) {
                                throw error;
                            }
                            else {
                                console.log("!!!!!!!!!!!!!!!!!!!!! successfully returned from userEmailSearch method call in client !!!!!!!!!!!!!");
                                console.log(res);
                                // qq works instantly with ngZone
                                observer.next(res);
                                observer.complete();
                            }
                        });

                    });
                }
            }
            else {
                let nada = [ ];
                observer.next(nada);
                observer.complete();
            }
        });
    }


    /**
     * User Rankings info
     * WithdrawStatus, submitStatus, requestStatus
     *
     */
    initializeUserInfo(override) {

        console.error('=========== Score 66 ===> ' + this.score);
        if ( (!this.score) || (override)) {

            Meteor.call('getLocaUserInfo', Meteor.userId(), (error, res) => {
                if (error) {
                    alert("ERROR: logged in user does not exist??");
                    console.error(error)
                }
                else {
                    console.log(res);
                    this.payRequestDefault = res.settings.payRequestDefault;
                    this.payRequestMax = res.settings.payRequestMax;
                    this.minHoursDefault = res.settings.minHoursDefault;
                    this.minHoursMax = res.settings.minHoursMax;
                    this.quantityDefault = res.settings.quantityDefault;
                    this.quantityMax = res.settings.quantityMax;

                    if (res.settings.scheduledTimestamp != null) {
                        this.scheduledTimestamp = res.settings.scheduledTimestamp;
                    }
                    if (res.settings.scheduledDate != null) {
                        this.scheduledDate = res.settings.scheduledDate;
                    }
                    if (res.settings.scheduledHour != null) {
                        this.scheduledHour = res.settings.scheduledHour;
                    }
                    if (res.settings.scheduledMinute != null) {
                        this.scheduledMinute = res.settings.scheduledMinute;
                    }

                    if (res.settings.storeId != null) {
                        this.storeId = res.settings.storeId;
                    }
                    if (res.settings.storeName != null) {
                        this.storeName = res.settings.storeName;
                    }
                    if (res.settings.storeAddress != null) {
                        this.storeAddress = res.settings.storeAddress;
                    }

                    if (res.contractorIds != null) {
                        this.contractorIds = res.contractorIds;
                    }

                    this.skip = 0;
                    this.total = 0;

                    if (res.skip) {
                        this.skip = res.skip;
                    }
                    if (res.total) {
                        this.total = res.total;
                    }

                    if (res.storeChain) {
                        this.storeChain = res.storeChain;
                    }
                }

            });


            //ww These settings are not used in Admin and cron server - set same defaults for all admin users

            this.userBalance = 0;
            this.userPendingRequests = 0;
            this.userPendingSubmits = 0;
            this.totalBalance = 0;

            this.withdrawalStatus = 1;
            this.submitStatus = 1;
            this.requestStatus = 1;

            this.userProfile.firstname = 'Job';
            this.userProfile.lastname = 'One';

            this.cellVerified = true;

            this.score = 4.99;
            this.reactiveRanking.next({
                score: this.score,
            });
        }
    }



    getReactiveRanking() {
        return this.reactiveRanking;
    }

}

