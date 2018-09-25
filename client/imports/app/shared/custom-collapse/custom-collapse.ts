import { Component, NgZone, EventEmitter } from '@angular/core';

import template from './custom-collapse.html';

/**
 * Use example from:
 * http://blog.thoughtram.io/angular/2015/03/27/building-a-zippy-component-in-angular-2.html
 * https://embed.plnkr.co/dkorye/
 */
@Component({
    selector: 'custom-collapse',
    template,
    inputs: ['isOpen', 'labelName', 'labelName2'],
    outputs: ['outputIsOpen'],
})
export class CustomCollapseComponent {

    isOpen: boolean = true;
    outputIsOpen: EventEmitter<boolean>;

    labelName: string = 'Collapsible Label Name';
    labelName2: string = '';

    constructor(private _ngZone: NgZone) {
        this.outputIsOpen = new EventEmitter();
    }

    toggle() {
        this._ngZone.run(() => { // run inside Angular2 world
            this.isOpen = !this.isOpen;
        });

        this.outputIsOpen.emit(this.isOpen);

        // Return false to stop event propagation - bubbling up
        return false;
    }


}

