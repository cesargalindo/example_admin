import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { VariablesService } from '../services/VariablesService';

import { DialogItemDialogComponent } from './dialog-item-dialog';
import template from './dialog-item.html';

@Component({
  selector: 'dialog-item',
  template
})
export class DialogItemComponent implements OnInit {

  constructor(public dialog: MatDialog, public _varsService: VariablesService) { }
  
  ngOnInit() { }

  openDialog() {
    this.dialog.open(DialogItemDialogComponent, {
      height: window.innerHeight * 0.4  + 'px',
      width:  window.innerWidth * 0.6 + 'px',
      data: { 
        name: this._varsService.name,
        id: this._varsService.selectedItemId
      }
    });


  }


}

