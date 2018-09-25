import { Pipe, PipeTransform } from '@angular/core';

import moment = require("moment/moment");


@Pipe({
    name: 'displayFormatDateNow',
})
export class DisplayFormatDateNow implements PipeTransform {
    init: boolean = false;

    transform(expireAt: string): string {

        if (expireAt) {
            return moment(expireAt).fromNow();
        }
        else {
            return '--';
        }

    }
}


@Pipe({
    name: 'displayFormatDate',
    pure: false
})
export class DisplayFormatDate implements PipeTransform{
    transform(date: string): string {
        return moment(date).format('MM/DD/YY h:mm a');
    }
}


@Pipe({
    name: 'displayFormatDateSm',
    pure: false
})
export class DisplayFormatDateSm implements PipeTransform{
    transform(date: string): string {
        return moment(date).format('MM/DD/YY');
    }
}


@Pipe({
    name: 'displayFormatTime',
    pure: false
})
export class DisplayFormatTime implements PipeTransform{
    transform(date: string): string {
        return moment(date).format('h:mm:ss a');
    }
}



