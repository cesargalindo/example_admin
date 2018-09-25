
import { Component, OnInit, NgZone } from "@angular/core";
import { Router } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';

import { MeteorObservable } from 'meteor-rxjs';

import { VariablesService } from '../services/VariablesService';
import { Setting } from "../../../../both/models/setting.model";
import { Settings } from "../../../../both/collections/settings.collection";

import template from "./scrapers-report.html";
import style from "./scrapers-report.scss";

@Component({
    selector: 'scrapers-report',
    template,
    styles: [ style ]
})
export class ScrapersReportComponent implements OnInit {
    storeChains: Array<any>;
    scrapedStore: string;
    
    leChain: Array<any>;
    display_spinner: boolean = true;

    dataArray: Array<any>;

    reportsForm: FormGroup;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private _ngZone: NgZone,
        public _varsService: VariablesService) { }

    ngOnInit() {
        this._varsService.setReactiveTitleName('Report: Status of Scraped Items "sitems" and Prices');

        this.reportsForm = this.formBuilder.group({
            customUpdatedAt: [0],
        });

        this.storeChains = this._varsService.storeChains;

        let cnt = 1;
        MeteorObservable.subscribe('settings').zone().subscribe();
        Settings.find({}).subscribe(z => {
            this.dataArray = z;

            // call ONCE - I'm assuming once 'getScraperReport' is done, all Settings data will be available to getScraperReportData()
            if (cnt == 1) {
                this.getScraperReportData2(z);        
            }
            cnt++;
        })
    }

    getScraperReportData1() {
        Meteor.call('getScraperReport', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                this.display_spinner = false;
                if (err) {
                    console.error("!!!!!!!! ERROR: getScraperReportData1 !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: getScraperReportData1..." + res.error);
                    }
                    else {
                        this.leChain = res.data;
                    }
                }
            });
        });
    }


    getScraperReportData2(z) {
        Meteor.call('getScraperReport', (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                this.display_spinner = false;
                if (err) {
                    console.error("!!!!!!!! ERROR: getScraperReportData2 !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: getScraperReportData2..." + res.error);
                    }
                    else {
                        console.log('Successfully getScraperReportData2: ');
                        console.warn(res.data);
                        console.log(z);
                        res.data.map(s => {
                            let tmp = _.findWhere(z, {chainName: s.chainName});
                            if (tmp != undefined) {
                                s.skip = tmp.scrapedAt;
                            }
                        })
                        this.leChain = res.data;
                    }
                }
            });
        });
    }


    updateReportItem(info) {
        if (info.updatedAt == undefined) {
            alert('Scraper Update date is Invalid. Generate prices to ensure data is valid.');
            return;
        }
        else if (info.updated == undefined) {
            alert('Prices Update date is Invalid. Generate prices to ensure data is valid.');
            return;   
        }

        let sett = <Setting>{};
        sett.chainName = info.chainName;
        sett.scrapedAt = info.updatedAt;
        sett.pricedAt = info.updated;

        Meteor.call('insertUpdateSettings', sett, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world

                if (err) {
                    console.error("!!!!!!!! ERROR: insertNewSettings item !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: insertNewSettings item..." + res.error);
                    }
                    else {
                        console.log('Successfully insertNewSettings: ');
                        console.warn(res);
                    }
                }

            });
        });
    }


    updateCustomDate(info) {
        if (info.updatedAt == undefined) {
            alert('Scraper Update date is Invalid. Generate prices to ensure data is valid.');
            return;
        }
        else if (info.updated == undefined) {
            alert('Prices Update date is Invalid. Generate prices to ensure data is valid.');
            return;   
        }

        let sett = <Setting>{};
        sett.chainName = info.chainName;
        sett.scrapedAt = this.reportsForm.value.customUpdatedAt;
        sett.pricedAt = info.updated;

        Meteor.call('insertUpdateSettings', sett, (err, res) => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (err) {
                    console.error("!!!!!!!! ERROR: insertNewSettings item !!!!!!!!!");
                    console.error(err);
                } else {
                    if (!res.status) {
                        console.error("!!!!!!!! ERROR ON: insertNewSettings item..." + res.error);
                    }
                    else {
                        console.log('Successfully insertNewSettings: ');
                        console.warn(res);
                    }
                }
            });
        });
    }

}



