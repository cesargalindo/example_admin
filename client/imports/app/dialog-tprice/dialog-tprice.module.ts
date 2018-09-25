import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatInputModule, MatDialogModule } from '@angular/material';

import { DialogTpriceComponent } from './dialog-tprice';
import { DialogTpriceDialogComponent } from './dialog-tprice-dialog';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule,
    ],
    declarations: [ DialogTpriceComponent, DialogTpriceDialogComponent ],
    exports: [ DialogTpriceComponent, DialogTpriceDialogComponent ],
    entryComponents: [
        DialogTpriceDialogComponent
    ],
})
export class DialogTpriceModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: DialogTpriceModule,
        };
    }

    constructor() {
        console.warn('----- constructor -- DialogTpriceModule ------');
    }
}