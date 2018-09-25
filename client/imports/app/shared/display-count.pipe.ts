import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'displayCount',
})
export class DisplayCount implements PipeTransform {

    transform(value: number): string {
        switch(value) {
            case 0:
                return '1st';
                break;
            case 1:
                return '2nd';
                break;
            case 2:
                return '3rd';
                break;
            default:
                return '--';
        }
    }
}



