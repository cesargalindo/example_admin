import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AccountsModule } from 'angular2-meteor-accounts-ui';
import { Ng2PaginationModule } from 'ng2-pagination';
import { AgmCoreModule } from '@agm/core';

import { AppComponent } from './app.component';
import { LANDING_DECLARATIONS } from './landing-page';
import { SHARED_DECLARATIONS } from './shared';
import { SETTINGS_DECLARATIONS } from './settings-page';

import {
  MatChipsModule, 
  MatToolbarModule,
  MatInputModule,
  MatMenuModule,
  MatIconModule,
  MatSliderModule,
  MatSelectModule,
  MatTabsModule,
  MatSnackBarModule,
  MatRadioModule,
  MatCheckboxModule,
  MatButtonModule,
  MatSidenavModule,
  MatListModule,
  MatDialogModule,
  MatCardModule,
  MatAutocompleteModule,
  MatProgressSpinnerModule, 
  MatNativeDateModule,
  MatDatepickerModule,
  MatProgressBarModule,
  // MatGridListModule,
} from "@angular/material";
import 'hammerjs';

import { REQUEST_DECLARATIONS, REQUEST_PROVIDERS } from './requestprices';
import { SUBMIT_DECLARATIONS, SUBMIT_PROVIDERS } from './submitprices';
import { STORE_DECLARATIONS } from './stores';
import { USER_DECLARATIONS } from './users';
import { ITEM_DECLARATIONS } from './items';
import { PRICE_DECLARATIONS } from './prices';
import { ISSUES_DECLARATIONS } from './issues';
import { LOAD_DATA_DECLARATIONS } from './load-data';
import { INFO_DECLARATIONS } from './info'
import { TRANSFER_DECLARATIONS } from './transfers';
import { SCRAPERS_DECLARATIONS } from './scrapers';

import { SideMenus } from './shared/side-menus/side-menus';

import { routes, ROUTES_PROVIDERS } from './app.routes';
import { AUTH_DECLARATIONS } from "./auth/index";
import { AUTH_PROVIDERS } from "./services/auth";
import { SERVICES_PROVIDERS } from './services';

import { DialogSitemModule } from './dialog-sitem/dialog-sitem.module';
import { DialogItemModule } from './dialog-item/dialog-item.module';
import { DialogTpriceModule } from './dialog-tprice/dialog-tprice.module';

import { ApolloModule } from 'angular2-apollo';
import { provideClient } from './client';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    AccountsModule,
    Ng2PaginationModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyCav3xW1eBqKqQVQqq9CGDFYnS9B2L2Sl0',
      libraries: ['places']
    }),
    DialogItemModule,
    DialogSitemModule,
    DialogTpriceModule,
    MatChipsModule,
    MatToolbarModule,
    MatInputModule,
    MatMenuModule,
    MatIconModule,
    MatSliderModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatDialogModule,
    MatCardModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule, 
    MatNativeDateModule,
    MatDatepickerModule,
    MatProgressBarModule,
    // MatGridListModule,
    ApolloModule.withClient(provideClient)
  ],
  declarations: [
    AppComponent,
    SideMenus,
    ...AUTH_DECLARATIONS,
    ...LANDING_DECLARATIONS,
    ...SHARED_DECLARATIONS,
    ...REQUEST_DECLARATIONS,
    ...SUBMIT_DECLARATIONS,
    ...STORE_DECLARATIONS,
    ...USER_DECLARATIONS,
    ...ITEM_DECLARATIONS,
    ...PRICE_DECLARATIONS,
    ...ISSUES_DECLARATIONS,
    ...SETTINGS_DECLARATIONS,
    ...LOAD_DATA_DECLARATIONS,
    ...INFO_DECLARATIONS,
    ...TRANSFER_DECLARATIONS,
    ...SCRAPERS_DECLARATIONS,
  ],
  providers: [
    ...AUTH_PROVIDERS,
    ...ROUTES_PROVIDERS,
    ...SERVICES_PROVIDERS,
    ...REQUEST_PROVIDERS,
    ...SUBMIT_PROVIDERS,
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {}