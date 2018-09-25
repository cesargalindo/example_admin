import { Injectable, NgZone } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/withLatestFrom';

import { ElasticParams } from '../../../../both/models/helper.models';

@Injectable()
export class ElasticSearchService {

    public ss1_gunit: string;

    constructor(private _ngZone: NgZone) { }

    /**
     * @param term 
     */
    elasticSearch_ss1(term: string) {
        // http://stackoverflow.com/questions/33675155/creating-and-returning-observable-from-angular-2-service

        return new Observable.create(observer => {

            // ensure search term is greater than 2 characters before sending to server
            if (term.length < 3) {
                let nada = [ ];
                observer.next(nada);
                observer.complete();
            }
            else {
                // ss -  Elasticsearch call must reside in server...
                Meteor.call('ss1Search', term, (error, res) => {

                    this._ngZone.run(() => {

                        if (error) {
                            console.error(error);
                            throw error;

                        } else {
                            console.log("!!!!!!!!!!!!!!!!!!!!! successfully returned from Elasticsearch method call in client !!!!!!!!!!!!!");
                            console.log(res);

                            if (res.length) {
                                this.ss1_gunit = _.first( res ).gunit;                                
                            }

                            // qq works instantly with ngZone
                            observer.next(res);
                            observer.complete();

                        }
                    });

                });
            }

            console.log('===== promise elasticSearch_ss1 started ====== ' + term);
        });
    }


    /**
     *  Ideally this service should exist on server so we don't have to return data to client
     *  However, data set if very small, just an array of ids. Most likely negligible...
     * 
     * @param eParams 
     */
    elasticSearch_ss2(eParams: ElasticParams) {

        return new Observable.create(observer => {

            console.log("elasticSearch_ss2 == " + eParams.itemId + ' = ' + eParams.name + ' = ' + eParams.operator + ' -- ' +   eParams.quantity + ' -- ' + eParams.searchType );

            if (eParams.searchType == 'Stores near') {
                if (eParams.name == null) {
                    if (eParams.operator == 'all') {
                        eParams.type = '2a';
                    }
                    else {
                        eParams.type = '2b';
                    }
                }
                else {
                    if (eParams.operator == 'all') {
                        eParams.type = '2c';
                    }
                    else {
                        eParams.type = '2d';
                    }
                }
            }
            else {
                alert('ERROR: Store query is no longer supported');
            }

            Meteor.call('ss2_Search', eParams, (error, res) => {

                this._ngZone.run(() => {

                    if (error) {
                        throw error;

                    } else {
                        console.log("==========>>>> ss2_Search successfully returned from Elasticsearch method call.. !!!!!!!!!!!!!");
                        console.log(res);

                        observer.next(res);
                        observer.complete();
                    }

                });

            });

        });

    }

    /**
     * @param eParams 
     */
    elasticSearch_ss3(eParams: ElasticParams) {

        return new Observable.create(observer => {

            if (eParams.searchType == 'Store') {

                if (eParams.name == null) {
                    if (eParams.operator == 'all') {
                        eParams.type = '3e';
                    }
                    else {
                        alert ('ERROR 22: invalid operator provided...');
                        return;
                    }
                }
                else {
                    if (eParams.operator == 'all') {
                        eParams.type = '3g';
                    }
                    else {
                        alert ('ERROR 23: invalid operator provided...');
                        return;
                    }
                }
            }

            Meteor.call('ss3_Search', eParams, (error, res) => {
                this._ngZone.run(() => {

                    if (error) {
                        throw error;

                    } else {
                        console.log("==========>>>> ss3_Search successfully returned from Elasticsearch method call.. !!!!!!!!!!!!!");
                        console.log(res);

                        observer.next(res);
                        observer.complete();
                    }
                });

            });

        });

    }



}

