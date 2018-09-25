import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'displayRequestpriceStatus',
})
export class DisplayRequestpriceStatus implements PipeTransform {

    transform(value: number): string {
        switch(value) {
            case -1:
                return 'rejected';
                break;
            case 0:
                return '0 - ??';
                break;
            case 1:
                return 'active';
                break;
            case 2:
                return 'paid';
                break;
            case 3:
                return 'expired';
                break;
            case 4:
                return 'cancelled';
                break;
            case 9:
                return 'pending';
                break;
            default:
                return '--';
        }
    }
}


@Pipe({
    name: 'displayPriceStatus',
})
export class DisplayPriceStatus implements PipeTransform {

    transform(value: number): string {
        switch(value) {
            case 99999.01:
                return 'SoldOut';
                break;
            case 99999.06:
                return '--';
                break;
            default:
                return value;
        }
    }
}


@Pipe({
    name: 'displaySubmitpriceStatus',
})
export class DisplaySubmitpriceStatus implements PipeTransform {

    transform(value: number): string {
        switch(value) {
            case -1:
                return 'error';
                break;
            case 0:
                return '0 - ??';
                break;
            case 1:
                return 'ready';
                break;
            case 2:
                return 'processing';
                break;
            case 3:
                return 'rejected';
                break;
            case 5:
                return 'closed';
                break;
            default:
                return '--';
        }
    }
}


@Pipe({
    name: 'displayItemStatus',
})
export class DisplayItemStatus implements PipeTransform {

    transform(value: number): string {
        switch(value) {
            case -2:
                return 'rejected';
                break;
            case -1:
                return 'duplicate';
                break;
            case 0:
                return 'inactive';
                break;
            case 1:
                return 'active';
                break;
            default:
                return '--';
        }
    }
}


@Pipe({
    name: 'displayWithdrawalStatus',
})
export class DisplayWithdrawalStatus implements PipeTransform {

    transform(value: number): string {
        switch(value) {
            case -1:
                return 'blocked';
                break;
            case 0:
                return 'pending';
                break;
            case 1:
                return 'active';
                break;
            case 2:
                return 'activeByDeposit';
                break;
            default:
                return '--';
        }
    }
}


@Pipe({
    name: 'displayRequestStatus',
})
export class DisplayRequestStatus implements PipeTransform {

    transform(value: number): string {
        switch(value) {
            case -1:
                return 'blocked';
                break;
            case 0:
                return 'pending';
                break;
            case 1:
                return 'active';
                break;
            default:
                return '--';
        }
    }
}


@Pipe({
    name: 'displaySubmitStatus',
})
export class DisplaySubmitStatus implements PipeTransform {

    transform(value: number): string {
        switch(value) {
            case -1:
                return 'blocked';
                break;
            case 0:
                return 'pending';
                break;
            case 1:
                return 'active';
                break;
            default:
                return '--';
        }
    }
}


/**
 * Used in Admin app
 */
@Pipe({
    name: 'displayScheduledStatus',
})
export class DisplayScheduledStatus implements PipeTransform {

    transform(value: number): string {
        switch(value) {
            case -1:
                return 'blocked';
                break;
            case 0:
                return 'pending';
                break;
            case 1:
                return 'active';
                break;
            case 2:
                return 'processed';
                break;
            case 3:
                return 'cancelled';
                break;
            default:
                return '--';
        }
    }
}