import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatInputModule, MatDialogModule } from '@angular/material';

import { DialogItemComponent } from './dialog-item';
import { DialogItemDialogComponent } from './dialog-item-dialog';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule,
    ],
    declarations: [ DialogItemComponent, DialogItemDialogComponent ],
    exports: [ DialogItemComponent, DialogItemDialogComponent ],
    entryComponents: [
        DialogItemDialogComponent
    ],
})
export class DialogItemModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: DialogItemModule,
        };
    }

    constructor() {
        console.warn('----- constructor -- DialogItemModule ------');
    }
}