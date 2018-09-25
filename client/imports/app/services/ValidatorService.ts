import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';


@Injectable()
export class ValidatorsService {

    public isInteger = (control:FormControl) => {
        return check_if_is_integer(control.value) ? null : {
            isInteger: true
        }
    }


    public isValidNumber = (control:FormControl) => {
        return check_if_is_valid_number(control.value) ? null : {
            isNumeric: true
        }
    }


    public isValidDateHours = (control:FormControl) => {
        return check_if_is_min_max(control.value, 0.20, 500) ? null : {
            isMinMax: true
        }
    }

    public isValidPayRequest = (control:FormControl) => {
        return check_if_is_min_max(control.value, 1, 9999) ? null : {
            isMinMax: true
        }
    }


    public isValidQuantity = (control:FormControl) => {
        return check_if_is_min_max(control.value, 1, 300) ? null : {
            isMinMax: true
        }
    }

    public isValidItemName = (control:FormControl) => {
        return check_if_is_min_length(control.value, 10) ? null : {
            isMinLength: true
        }
    }

    public isValidPrice = (control:FormControl) => {
        return check_if_is_min_max(control.value, 0.01, 10000) ? null : {
            isMinMax: true
        }
    }

}

/**
 * 
 * @param value 
 */
function check_if_is_integer(value){
    if((parseFloat(value) == parseInt(value)) && !isNaN(value)){
        // when saving data you do another parseInt.
        return true;
    } else {
        return false;
    }
}

/**
 * 
 * @param value 
 */
function check_if_is_valid_number(value) {
    // Check for empty values - throw error if empty
    if (!isNaN(value) && (value != '') ) {
        return true;
    }
    else {
        return false;
    }
}

/**
 * 
 * @param value 
 * @param min 
 * @param max 
 */
function check_if_is_min_max(value, min, max) {

    if ( (parseFloat(value) >= min ) && (parseFloat(value) <= max ) ) {
        return true;
    }
    else {
        return false;
    }

}

/**
 * 
 * @param value 
 * @param min 
 */
function check_if_is_min_length(value, min) {
    // check if value is a string with min length
    if ( (_.isString(value)) && (value.length > min) ){
        return true;
    }
    else {
        return false;
    }

}


