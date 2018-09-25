import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'displayLargeImage',
})
export class DisplayLargeImage implements PipeTransform {

    // Replace /125x/ with 600x
    transform(image: string): string {
        return image.replace("/125x/", "/600x/");
    }
}


