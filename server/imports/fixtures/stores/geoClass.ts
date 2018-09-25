import { Meteor } from 'meteor/meteor';

/**
 * 
 * Used to retrieve Lat, Lon coordinates on an address from Google API
 *
 * meteor add http
 * 
 */
export class GeoClass {

    // Property (public by default)

    private _address: string;
    private _city: string;
    private _state: string;

    private _geocoordinates: Object;

    private _lat: string;
    private _lng: string;
    
    // Constructor
    constructor() { }

    // Getters and Setters
    public getGeoCoordinates(type: string):Object {
        if (type == 'lat'){
             return this._lat;
        }
        else if(type == 'lng') {
            return this._lng;
        }
        
        return this._geocoordinates;
    }

    public processGeoCoordinates(address: string, city: string, state: string): boolean {

        // trim leading and trailing white spaces
        this._address = address.replace(/(^[\s]+)|([\s]+$)/g, '');
        this._city = city.replace(/(^[\s]+)|([\s]+$)/g, '');
        this._state = state.replace(/(^[\s]+)|([\s]+$)/g, '');

        // replace spaces with +
        this._address =  this._address.replace(" ", "+");
        this._city =  this._city.replace(" ", "+");
        this._state =  this._state.replace(" ", "+");

        // construct URL
        // address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=AIzaSyCrbbX-q8hsFEZMv-uKW8HF1BtTTtHaZao

        // I need to add the package:  meteor add http

        // qq - Remove callback to turn into a sync call

        // console.log('=======> WARNING WARNING WARNING --Google geolcation coordinates is disabled... <====== WARNING WARINING WARNING <=======');
        let kungfu = 1;
        if (kungfu) {
            let response = this._geocoordinates = HTTP.call( 'GET', Meteor.settings.GOOGLE_URL, {
                params: {
                    "address": this._address + ','  + this._city + ',' + this._state,
                    "key": Meteor.settings.GOOGLE_API_KEY
                }
            });

            if ( (response.data.status == 'ZERO_RESULTS') || (response.data.status == 'UNKNOWN_ERROR') ) {
                console.log(response.data);
                return false;
            }

            this._geocoordinates = {lat: response.data.results[0].geometry.location.lat, lng: response.data.results[0].geometry.location.lng };
            this._lat = response.data.results[0].geometry.location.lat;
            this._lng = response.data.results[0].geometry.location.lng;
        }
        else {
            this._lat = "45.454545";
            this._lng = "-75.757575";
        }

        return true;
    }

}