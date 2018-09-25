import { Route } from '@angular/router';
import { Meteor } from 'meteor/meteor';

import { LandingPageComponent } from './landing-page/landing-page';
import { SliderSettingsComponent } from './settings-page/slider-settings';

import { InfoComponent } from './info/info';

import { MyRequestpricesComponent } from './requestprices/my-requestprices';
import { RequestpricesEditComponent} from './requestprices/requestprices-edit';
import { RequestpricesCreatePComponent } from './requestprices/requestprices-create-p';
import { RPScheduleCreateComponent } from './requestprices/rp-schedule-create';
import { RPScheduleList } from './requestprices/rp-schedule-list';

// import { SubmitpricesCreateComponent } from './submitprices/submitprices-create';
import { SPScheduleList } from './submitprices/sp-schedule-list';
import { SubmitpricesCreatePComponent } from './submitprices/submitprices-p';
import { SPScheduledCreateComponent } from './submitprices/sp-scheduled-create';
import { SPSubmittedComponent } from './submitprices/sp-submitted';
import { SPRejectedComponent } from './submitprices/sp-rejected';
import { SPClosedComponent } from './submitprices/sp-closed';

import { StoresListComponent } from './stores/stores-list';
import { StoresEditComponent } from './stores/stores-edit';

import { ItemsListComponent } from './items/items-list';
import { ItemsList2Component } from './items/items-list2';
import { ItemsContractorComponent } from './items/items-contractor';
import { ItemsEditComponent } from './items/items-edit';
import { ItemsDuplicateComponent } from './items/items-duplicate';
import { ItemsNewComponent } from './items/items-new';
import { ItemsDuplicatesComponent } from './items/items-duplicates';
import { ItemsTagsComponent } from './items/items-tags';
import { ItemsAddByUPCComponent } from './items/items-add-byupc';
import { ItemsSearchComponent } from './items/items-search';

import { UsersListComponent } from './users/users-list';
import { UsersEditComponent } from './users/users-edit';
import { UsersTransferComponent } from './users/users-transfer';
import { UsersListCountComponent } from './users/users-list-count';

import { TransfersListComponent } from './transfers/transfers-list';

import { PricesListComponent } from './prices/prices-list';
import { MyTpricesComponent } from './prices/my-tprices';
import { TpriceEditComponent } from './prices/edit-tprice';

import { IssuesListComponent } from './issues/issues-list';

import { ScrapersCheckComponent } from './scrapers/scrapers-check';
import { ScrapersReportComponent } from './scrapers/scrapers-report';
import { ScrapersList1Component } from './scrapers/scrapers-list1';
import { ScrapersList2Component } from './scrapers/scrapers-list2';
import { ItemsMatchComponent } from './scrapers/items-match';

import { LoadDataComponent } from './load-data/load-data';

import { LoginComponent } from "./auth/login.component";
import { SignupComponent } from "./auth/signup.component";
import { RecoverComponent } from "./auth/recover.component";
import { ResetComponent } from "./auth/reset.component";
import { SetPasswordComponent } from "./auth/setPassword.component";

import { AuthService } from './services/auth/auth.service';
import { AuthGuard } from './services/auth/auth-guard';
import { AuthGuardAdmin } from './services/auth/auth-guard-admin';
import { AuthGuardContractor } from './services/auth/auth-guard-contractor';
import { AuthGuardLeadContractor } from './services/auth/auth-guard-leadContractor';


export const routes: Route[] = [

  { path: '', component: LandingPageComponent },
  { path: 'settings', component: SliderSettingsComponent, canActivate: [AuthGuardLeadContractor] },
  { path: 'info', component: InfoComponent, canActivate: [AuthGuardContractor] },
  
  { path: 'stores', component: StoresListComponent, canActivate: [AuthGuardAdmin] },
  { path: 'store', component: StoresEditComponent, canActivate: [AuthGuardAdmin] },
  { path: 'store-edit', component: StoresEditComponent, canActivate: [AuthGuardAdmin] },

  { path: 'items-c', component: ItemsContractorComponent, canActivate: [AuthGuardContractor] },
  { path: 'item', component: ItemsEditComponent, canActivate: [AuthGuardContractor] },
  { path: 'item-edit', component: ItemsEditComponent, canActivate: [AuthGuardContractor] },

  { path: 'items', component: ItemsListComponent, canActivate: [AuthGuardLeadContractor] },
  { path: 'items2', component: ItemsList2Component, canActivate: [AuthGuardAdmin] },
  { path: 'item-duplicate', component: ItemsDuplicateComponent, canActivate: [AuthGuardAdmin] },
  { path: 'item-new', component: ItemsNewComponent, canActivate: [AuthGuardAdmin] },
  { path: 'items-dup', component: ItemsDuplicatesComponent, canActivate: [AuthGuardAdmin] },
  { path: 'items-tags', component: ItemsTagsComponent, canActivate: [AuthGuardContractor    ] },
  { path: 'items-add-upc', component: ItemsAddByUPCComponent, canActivate: [AuthGuardAdmin] },
  { path: 'items-search', component: ItemsSearchComponent, canActivate: [AuthGuardAdmin] },
  
  { path: 'prices', component: PricesListComponent, canActivate: [AuthGuardAdmin] },
  { path: 'my-prices', component: MyTpricesComponent, canActivate: [AuthGuardLeadContractor] },
  { path: 'edit-tprice', component: TpriceEditComponent, canActivate: [AuthGuardLeadContractor] },

  { path: 'issues', component: IssuesListComponent, canActivate: [AuthGuardAdmin] },

  { path: 'scrapes-check', component: ScrapersCheckComponent, canActivate: [AuthGuardAdmin] },
  { path: 'scrapes-report', component: ScrapersReportComponent, canActivate: [AuthGuardAdmin] },
  
  { path: 'scrapes2', component: ScrapersList2Component, canActivate: [AuthGuardAdmin] },
  { path: 'scrapes1', component: ScrapersList1Component, canActivate: [AuthGuardLeadContractor] },
  { path: 'items-match', component: ItemsMatchComponent, canActivate: [AuthGuardLeadContractor] },
  
  { path: 'load-data', component: LoadDataComponent, canActivate: [AuthGuardAdmin] },

  { path: 'myrequestprices', component: MyRequestpricesComponent, canActivate: [AuthGuardAdmin] },
  { path: 'requestprices-edit', component: RequestpricesEditComponent, canActivate: [AuthGuardAdmin] },
  { path: 'requestprices-p', component: RequestpricesCreatePComponent, canActivate: [AuthGuardAdmin] },
  { path: 'rp-schedule-cr', component: RPScheduleCreateComponent, canActivate: [AuthGuardAdmin] },
  { path: 'rp-schedule', component: RPScheduleList, canActivate: [AuthGuardAdmin] },

  { path: 'sp-schedule', component: SPScheduleList, canActivate: [AuthGuardAdmin] },
  { path: 'sp-schedule-cr', component: SPScheduledCreateComponent, canActivate: [AuthGuardAdmin] },
  { path: 'spsubmitted', component: SPSubmittedComponent, canActivate: [AuthGuardAdmin] },
  { path: 'sprejected', component: SPRejectedComponent, canActivate: [AuthGuardAdmin] },
  { path: 'spclosed', component: SPClosedComponent, canActivate: [AuthGuardAdmin] },
  { path: 'submitprices-p', component: SubmitpricesCreatePComponent, canActivate: [AuthGuardAdmin] },

  { path: 'users', component: UsersListComponent, canActivate: [AuthGuardAdmin] },
  { path: 'users-edit', component: UsersEditComponent, canActivate: [AuthGuardAdmin] },
  { path: 'users-transfer', component: UsersTransferComponent, canActivate: [AuthGuardAdmin] },
  { path: 'users-counts', component: UsersListCountComponent, canActivate: [AuthGuardAdmin] },
  
  { path: 'transfers', component: TransfersListComponent, canActivate: [AuthGuardContractor] },
  
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'recover', component: RecoverComponent },
  { path: 'reset-password/:token', component: ResetComponent },
  { path: 'set-password', component: SetPasswordComponent }
];

export const ROUTES_PROVIDERS = [{
  provide: 'canActivateForLoggedIn',
  useValue: () => !! Meteor.userId(),
  AuthService,
  AuthGuard,
  AuthGuardAdmin
}];
