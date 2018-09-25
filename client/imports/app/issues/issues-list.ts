import { Component, OnInit } from "@angular/core";

import { Issue } from "../../../../both/models/issue.model";
import { Issues } from "../../../../both/collections/issues.collection";
import { VariablesService } from '../services/VariablesService';

import { MeteorObservable } from 'meteor-rxjs';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

import { Counts } from 'meteor/tmeasday:publish-counts';

import template from "./issues-list.html";

@Component({
    selector: "issues-list",
    template,
})
export class IssuesListComponent implements OnInit {

    // combine observables
    private combined$: Observable<any[]>;
    data: Observable<Issue[]>;
    subCount: Observable<any>;

    private issuesSub: Subscription;

    pageSize: number = 10;
    dateOrder: number = -1;
    p: number = 1;

    // Data pushed to template
    totalCount: number;
    dataArray: Array<any>;


    constructor(public _varsService: VariablesService) { }


    ngOnInit() {
        this._varsService.setReactiveTitleName('ISSUES');
        this.getPageX(this.p);
    }


    getPageX(x) {
        this.p = x;

        this.getObservables();

        // Pushed data to dataArray when both observables have fired
        this.combined$ = Observable.combineLatest(this.data, this.subCount);

        this.combined$.subscribe(x => {
            this.dataArray = x[0];
            console.log(x);
        });
    }



    getObservables() {
        let options = {
            limit: this.pageSize,
            skip: (this.p - 1) * this.pageSize,
            sort: {created: this.dateOrder},
        };

        this.issuesSub = MeteorObservable.subscribe('issues', options).zone().subscribe();

        this.subCount = new Observable.create(observer => {
            MeteorObservable.autorun().zone().subscribe(() => {
                this.totalCount = Counts.get('numberOfIssues');
                console.log('--numberOfIssues A-->> '+ this.totalCount);

                if (this.totalCount) {
                    console.log('--numberOfIssues B-->> '+ this.totalCount);

                    observer.next(this.totalCount);
                    observer.complete();
                }

            });
        });

        this.data = Issues.find({}, options);
    }




}