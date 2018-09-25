
export class infoModel {
    constructor(
        public userId: string,
        public adminKey: string,
        public ownerId: string,
        public collection: string,
        public id: string,
    ) {  }
}

/**
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
export function getGlobalSize(size: number, unit: string) {
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
