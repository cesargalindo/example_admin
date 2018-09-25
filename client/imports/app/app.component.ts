import { Meteor } from 'meteor/meteor';
import { Component, OnInit } from '@angular/core';
import { Router }  from '@angular/router';

import { InjectUser } from "angular2-meteor-accounts-ui";
import { AuthService } from './services/auth/auth.service';
import { VariablesService } from './services/VariablesService';
import { CacheStateService } from './services/CacheStateService';
import { UserService } from './services/UserService';
// import { SocketClientService } from './services/SocketClientService';
import { LocationTrackingService } from './services/LocationTrackingService';
import { SearchHistoryService } from './services/SearchHistoryService';

import template from './app.component.html';

// Include service in providers who to make them a singleton "global"

@Component({
  selector: 'app',
  template,
  providers: [CacheStateService, UserService, VariablesService]
})
@InjectUser('user')
export class AppComponent implements OnInit {
  user: Meteor.User;
  userInfo: Object;
  score: number;

  constructor(
      public _authService: AuthService,
      private router: Router,
      private _userService: UserService,
      private _varsService: VariablesService,
      private _cacheState: CacheStateService,
      // public _socketService: SocketClientService,
      public _searchHistory: SearchHistoryService,
      public _locationTrackingService: LocationTrackingService) { }


  ngOnInit() {

    // Load locally stored search history from device
    this._searchHistory.loadAll();

    // Initialize snapshots instantly without coordinate then update after coordinates are loaded
    this._cacheState.intializeSnapshots();

    if (Meteor.userId()) {
      // call on app reload
      this._userService.initializeUserInfo(false);
    }

    this._varsService.initializeGlobalVariables();

    // Initialize login checks - call async function, then use Reactive login to update login status
    this._authService.checkLogin();

    let reactiveRankings = this._userService.getReactiveRanking();
    reactiveRankings.subscribe(x => {
      this.score = x.score;
    });

    this.userInfo = this._userService;
  }
}
