import { Meteor } from 'meteor/meteor';
import { Component, OnInit, NgZone, AfterContentChecked } from '@angular/core';
import { Router }  from '@angular/router';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { Item } from '../../../../both/models/item.model';
import { VariablesService } from '../services/VariablesService';
import { ValidatorsService } from '../services/ValidatorService';
import { SnackbarService } from '../services/SnackbarService';

import { Random } from 'meteor/random';
import template from './items-new.html';
import style from './items-new.scss';

/**
 * Save custom address only when user clicks or hits enter key on a provided Google Place
 * update placeholder string with new custom address value
 *
 * Uses my custom geolocation Meteor package  -- http://www.webtempest.com/meteor-js-packages-tutorial
 *
 */
@Component({
    selector: 'items-new',
    template,
    styles: [ style ]
})
export class ItemsNewComponent implements OnInit, AfterContentChecked {
    requestNewItemForm: FormGroup;

    aws_image_path: string;
    aws_image_path_thumb: string;

    thumb_image: string;
    thumb_spinner: boolean = false;

    no_image_thumb: string;
    display_spinner: boolean = false;

    itemInfo: Item;

    itemId: string;

    labels: Object;
    errors: Object;
    msgs: Object;


    unitsList = [
        { value: '-c-', viewValue: '___COUNT___' },
        { value: 'ct', viewValue: 'count (ct)' },
        { value: '-w-', viewValue: '___WEIGHT___' },
        { value: 'lb', viewValue: 'pounds (lb)' },
        { value: 'oz', viewValue: 'ounces (oz)' },
        { value: 'kg', viewValue: 'kilograms (kg)' },
        { value: 'gm', viewValue: 'grams (gm)' },
        { value: '-v-', viewValue: '___VOLUME___' },
        { value: 'fl oz', viewValue: 'fl ounces (fl oz)' },        
        { value: 'gal', viewValue: 'gallons (gal)' },
        { value: 'lt', viewValue: 'liters (lt)' },
        { value: 'qt', viewValue: 'quarts (qt)' },
        { value: 'pt', viewValue: 'pints (pt)' },
        { value: 'ml', viewValue: 'milliliters (ml)' },
    ];
    ctSelected: boolean;

    constructor(
        public _snackbar: SnackbarService,
        private router: Router,
        private formBuilder: FormBuilder,
        private _ngZone: NgZone,
        public _varsService: VariablesService,
        private _validatorsService: ValidatorsService) { }

    ngOnInit() {
        // Hide top toolbar to allow buttons to be shown on top
        this._varsService.setReactiveHideToolbar(true);

        // component request1-sliders will redirect to home page if user Info has loaded - scenario occurs on a page refresh

        // Monitor reactiveLogin using an Observable subject
        let reactiveError  =  this._varsService.getReactiveError();
        reactiveError.subscribe(x => {
            this._ngZone.run(() => { // run inside Angular2 world
                if (x) {
                    this.display_spinner = false;
                    this._snackbar.displaySnackbar(1);
                }
            });
        });

        this.aws_image_path = Meteor.settings.public.AWS_IMAGE_PATH + Meteor.settings.public.AWS_IMAGE_DEFAULT;
        this.aws_image_path_thumb =  Meteor.settings.public.AWS_IMAGE_PATH + Meteor.settings.public.AWS_IMAGE_THUMB;
        this.thumb_spinner = false;
        this.no_image_thumb = Meteor.settings.public.GOOGLE_IMAGE_PATH  + Meteor.settings.public.GOOGLE_IMAGE_THUMB + 'no/' + Meteor.settings.public.GOOGLE_NO_IMAGE;

        this._varsService.resetFormErrorVairables();
        this.labels = this._varsService.labels;
        this.errors = this._varsService.errors;
        this.msgs = this._varsService.msgs;

        this.requestNewItemForm = this.formBuilder.group({
            itemImage: [''],
            itemSize: [''],
            itemUnit: ['oz', Validators.required],            
            itemName: ['', this._validatorsService.isValidItemName ],
        });

    }


    onChangeUnits(unit) {
        this._ngZone.run(() => { // run inside Angular2 world
            if (unit == '-c-') {
                this.requestNewItemForm.patchValue({
                    itemUnit: 'ct'
                });
                this.ctSelected = true;
            }
            else if (unit == 'ct') {
                this.ctSelected = true;                
            }            
            else if (unit == '-w-') {
                this.requestNewItemForm.patchValue({
                    itemUnit: 'oz'
                });
                this.ctSelected = false;
            }
            else if (unit == '-v-') {
                this.requestNewItemForm.patchValue({
                    itemUnit: 'gal'
                });
                this.ctSelected = false;
            }
            else {
                this.ctSelected = false;
            }
        });
    }

    
    /**
     *
     * 1) Add new Item
     *
     */
    addNewRequestPrice() {

        if (this.requestNewItemForm.valid) {

            this.display_spinner = true;
            this.errors['error'] = '';

            // Start displaying progress image
            this._snackbar.resetSnackbar();

            let i = <Item>{};
            i.name = this.requestNewItemForm.value.itemName;
            i.unit = this.requestNewItemForm.value.itemUnit;
            i.image = this.requestNewItemForm.value.itemImage;
            
            if (i.unit == 'ct') {
                i.size = 1;
            }
            else {
                i.size = parseInt(this.requestNewItemForm.value.itemSize);
            }

            Meteor.call('ddp.items.insert.byAdmin', i, false, (err, res) => {

                this._ngZone.run(() => { // run inside Angular2 world
                    this.display_spinner = false;

                    if (err) {
                        console.error("!!!!!!!! GO AN ERROR ON: items.insert.byAdmin..... !!!!!!!!!");
                        console.error(err);
                        this._varsService.setReactiveError();
                        this.errors['error'] =  err;
                        return;
                    }
                    else {
                        if (!res.status) {
                            console.error("!!!!!!!! ERROR ON: items.insert.byAdmin ..... !!!!!!!!! == " + res.error);
                            console.error(err);
                            this.errors['error'] = res.error;
                            this._varsService.setReactiveError();
                            return;
                        }
                        else {
                            console.warn("SUCCESSFULLY INSERTED NEW items.insert.byAdmin... " + res.status);
                            console.warn(res);

                            this.router.navigate(['/items', { searchName: i.name }]);
                        }
                    }

                });

            });
        }
        else {
            // Process Form Errors
            let validateFields = {};
            validateFields['itemName'] = 1;

            this.errors = this._varsService.processFormControlErrors(this.requestNewItemForm.controls, validateFields);

            // Stay on page if we have an error - false = error
            return;
        }

    }



    /**
     * upload file by selecting through browser choose file option
     *
     * @param event
     */
    onChange(event) {
        let files = event.srcElement.files;
        this.thumb_spinner = true;

        let uploader = new Slingshot.Upload("myFileUploads");
        let captureThis = this;

        uploader.send(files[0], function (error, downloadUrl) {
            if (error) {
                // Log service detailed response.
                console.error('Error uploading', uploader.xhr.response);
                alert (error);
            }
            else {
                captureThis.updateImageParamsDelayed(files[0].name);
            }
        });

    }


    /**
     * Take picture using package
     * > meteor add mdg:camera
     */
    takeDaPicture() {
        CGMeteorCamera.getPicture({}, (error, res) => {
            if (error) {
                console.log('!!!!!!!!!!!!! Failed to fs log ${error}');
                console.log(error);
            }
            else {
                console.log('==== GOT PHOTO ====');
                let uploader = new Slingshot.Upload("myFileUploads");

                let fileName = 'pic_' + Random.id(17) + '.png';
                this._ngZone.run(() => { // run inside Angular2 world
                    this.thumb_spinner = true;
                });

                // place global this into a local variable that is accessible within scope of this function
                let captureThis = this;

                var imageFile = dataURLtoBlob(res, fileName);

                uploader.send(imageFile, function (error, downloadUrl) {
                    if (error) {
                        // Log service detailed response.
                        console.error('Error uploading', uploader.xhr.response);
                        alert (error);
                    }
                    else {
                        console.log(" upload url == " + downloadUrl);
                        captureThis.updateImageParamsDelayed(fileName);
                    }
                });

            }
        });
    }


    /**
     * 
     * @param fileName 
     */
    updateImageParamsDelayed(fileName) {
        // place global this into a local variable that is accessible within scope of this function
        let captureThis2 = this;

        var myInterval = Meteor.setInterval(function () {

            console.log("debug -----  1.2 second delayed -- filename -- " +  captureThis2.aws_image_path_thumb + ' -- ' + fileName);

            Meteor.call('checkValidImage', captureThis2.aws_image_path_thumb + fileName, (error, res) => {
                if (error) {
                    console.log(error);
                }
                else {
                    console.log(res);
                    if (res) {
                        Meteor.clearInterval(myInterval);
                        captureThis2.updateImageParams(fileName);
                    }
                }
            });
        }, 1200);
    }

    updateImageParams(fileName) {
        this._ngZone.run(() => { // run inside Angular2 world
            // thumb image only found on AWS - currently
            this.thumb_image = this.aws_image_path_thumb + fileName;
            this.thumb_spinner = false;

        });
        this.requestNewItemForm.patchValue({ itemImage: this.aws_image_path + fileName });
    }

}

/**
 * convert image url to blob
 * 
 * @param dataurl 
 * @param fileName 
 */
function dataURLtoBlob(dataurl, fileName) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);

    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }

    // return the file object
    let props = {};
    if (mime) {
        props.type = mime;
    }

    return new File([u8arr], fileName, props);
}