import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'displayDecimalDown',
})
export class DisplayDecimalDown implements PipeTransform {

    transform(value: number): number {
        return  value * 100;
    }
}

@Pipe({
    name: 'displayDecimalUp',
})
export class DisplayDecimalUp implements PipeTransform {

    transform(value: number): number {
        return  value * 0.01;
    }
}
