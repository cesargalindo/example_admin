import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { VariablesService } from '../services/VariablesService';
import { UserService } from '../services/UserService';

import { DialogTpriceDialogComponent } from './dialog-tprice-dialog';
import template from './dialog-tprice.html';

@Component({
  selector: 'dialog-tprice',
  template
})
export class DialogTpriceComponent implements OnInit {

  constructor(
    public dialog: MatDialog, 
    public _userService: UserService,
    public _varsService: VariablesService) { }
  
  ngOnInit() { }

  openDialog() {
    this.dialog.open(DialogTpriceDialogComponent, {
      height: window.innerHeight * 0.6  + 'px',
      width:  window.innerWidth * 0.8 + 'px',
      data: { 
        name: this._varsService.name,
        itemId: this._varsService.selectedItemId,
        storeInfo: this._userService.storeName + ', ' + this._userService.storeAddress,
        storeId: this._userService.storeId,
        startDate: this._userService.scheduledTimestamp
      }
    });


  }


}

