import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/UserService';

import template from './ranking.html';

/**
 * Search and Select stores component
 * Results are outputted to storeList array
 *
 */
@Component({
    selector: 'ranking',
    template,
})
export class RankingComponent implements OnInit {
    stars: Array<any>;
    score: number;

    constructor(public _userService: UserService) { }

    ngOnInit() {

        // moved this to app.component.ts - other user stuff besides ranking info now need to be initialized

        let reactiveRankings = this._userService.getReactiveRanking();
        reactiveRankings.subscribe(x => {
            this.stars = x.stars;
            this.score = x.score;
        });

    }

}

