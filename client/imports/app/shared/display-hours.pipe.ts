import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'displayHours',
})
export class DisplayHours implements PipeTransform {

    transform(hours: number): number {

        if (hours >= 48) {
            let x = hours / 24;
            let days = parseInt(x);
            let newHours = hours - ( 24 * days);
            return days + ' days and ' + newHours + ' hours';
        }
        else if (hours >= 24) {
            let x = hours / 24;
            let days = parseInt(x);
            let newHours = hours - ( 24 * days);
            return days + ' day and ' + newHours + ' hours';
        }
        else {
            return  hours + ' hours';
        }

    }
}




