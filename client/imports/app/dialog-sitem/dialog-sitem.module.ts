import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatInputModule, MatDialogModule } from '@angular/material';

import { DialogSitemComponent } from './dialog-sitem';
import { DialogSitemDialogComponent } from './dialog-sitem-dialog';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule,
    ],
    declarations: [ DialogSitemComponent, DialogSitemDialogComponent ],
    exports: [ DialogSitemComponent, DialogSitemDialogComponent ],
    entryComponents: [
        DialogSitemDialogComponent
    ],
})
export class DialogSitemModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: DialogSitemModule,
        };
    }

    constructor() {
        console.warn('----- constructor -- DialogSitemModule ------');
    }
}