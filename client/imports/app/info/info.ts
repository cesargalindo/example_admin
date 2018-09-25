import { Component, OnInit, NgZone } from "@angular/core";

import { VariablesService } from '../services/VariablesService';

import template from "./info.html";
import style from './info.scss';

@Component({
    selector: "info",
    template,
    styles: [ style ],
})
export class InfoComponent implements OnInit {

    constructor(
        private _ngZone: NgZone,        
        public _varsService: VariablesService) { }

    ngOnInit() { 
        this._varsService.setReactiveTitleName('How to enter item description, size, and units');
        
        let owner = Meteor.userId();
    }

    ngAfterViewInit() {
    }

    check123(x) {
        alert('thumbs up... ' + x);
    }

    check555(x) {
        alert('thumbs up... ' + x);
    }




}
