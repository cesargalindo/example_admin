import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'displayDistance',
})
export class DisplayDistance implements PipeTransform {

    transform(distance: string): string {
        return  Math.round(distance * 100) / 100;
    }
}




