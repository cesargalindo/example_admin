import { Injectable } from '@angular/core';

@Injectable()
export class MiscService {

    constructRedirectQuery(url) {

        let cnt = 0;
        let p1 = '';
        let uri_dec = decodeURIComponent(url);
        let first_split  = uri_dec.split(/;(.*)/);
        let params = {};


        // Split params ;.*=
        let second_split  = uri_dec.split(/;([a-zA-Z0-9]+)=/g);
        second_split.map(x => {

            if (cnt == 0) {
                // ## skip main url
            }
            else if (cnt % 2) {
                p1 = x;
            }
            else {
                params[p1] = x;
            }

            // alert(cnt + ' -- ' + x);
            // console.log(params);
            cnt++;
        })

        return {
            main: first_split[0],
            params: params
        }

    }

    /**
     * A dupicate copy of this function also reside on server code
     * 
     * 1 lb	--> 16 oz
     * 1 kg	-->  35.274 oz
     * 1 gm	--> 0.035274 oz
     * 
     * 1 gal --> 128 fl oz
     * 1 lt	--> 33.814 fl oz
     * 1 qt	--> 32 fl oz
     * 1 pt	--> 16 fl oz
     * 1 cup --> 8 fl oz
     * 1 ml --> 0.033814 fl oz
     * 
    */
    getGlobalSize(size: number, unit: string) {
        let gsize = 0;
        let gunit = '';

        // ff WEIGHT
        if (unit == 'lb') {
            gsize = size * 16;
            gunit = 'oz';
        }
        else if (unit == 'kg') {
            gsize = size * 35.274;
            gunit = 'oz';
        }
        else if (unit == 'gm') {
            gsize = size * 0.035274;
            gunit = 'oz';
        }
        else if (unit == 'oz') {
            gsize = size;
            gunit = 'oz';
        }
        
        // ff VOLUME
        else if (unit == 'gal') {
            gsize = size * 128;
            gunit = 'fl oz';
        }
        else if (unit == 'lt') {
            gsize = size * 33.814;
            gunit = 'fl oz';
        }
        else if (unit == 'qt') {
            gsize = size * 32;
            gunit = 'fl oz';
        }
        else if (unit == 'pt') {
            gsize = size * 16;
            gunit = 'fl oz';
        }
        else if (unit == 'cup') {
            gsize = size * 8;
            gunit = 'ml';
        }
        else if (unit == 'fl oz') {
            gsize = size;
            gunit = 'fl oz';
        }
        else if (unit == 'ml') {
            gsize = size * 0.033814;
            gunit = 'ml';
        }
        else if (unit == 'ct') {
            gsize = size;
            gunit = 'ct';
        }

        return {
            gsize: gsize,
            gunit: gunit
        }
    }



}

