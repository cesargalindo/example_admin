import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { VariablesService } from '../services/VariablesService';

import { DialogSitemDialogComponent } from './dialog-sitem-dialog';
import template from './dialog-sitem.html';

@Component({
  selector: 'dialog-sitem',
  template
})
export class DialogSitemComponent implements OnInit {

  constructor(public dialog: MatDialog, public _varsService: VariablesService) { }
  
  ngOnInit() { }

  openDialog() {
    this.dialog.open(DialogSitemDialogComponent, {
      height: window.innerHeight * 0.4  + 'px',
      width:  window.innerWidth * 0.6 + 'px',
      data: { 
        status: this._varsService.status,
        note: this._varsService.note,
        name: this._varsService.name,
        id: this._varsService.selectedItemId
      }
    });


  }


}

