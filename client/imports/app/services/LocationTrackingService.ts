/*
 * For an explanation of why things are done in certain ways, see my StackOverFlow post:
 * http://stackoverflow.com/a/43689109/2701392
 // */
// import * as Rx from 'rxjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Injectable, NgZone } from "@angular/core";
import { SearchHistoryService } from "./SearchHistoryService";
import { Meteor } from "meteor/meteor";

@Injectable()
export class LocationTrackingService {
    // Middle of Sierras
    private _defaultCustomLocation: Object = {latitude:37.7749, longitude:-120.4194, accuracy:50}        
    // Palo Alto
    private _defaultLocation: Object  = {latitude:37.7749, longitude:-122.4194, accuracy:100};           
    private _storageKey: string = Meteor.settings.public.LOCAL_STORAGE_PREFIX+"zojab.state.geolocation";
    //Save location data to storage 
    private _persistenceEnabled:boolean = true; 
    private watchId:number = -1;
    private lastError:any= null;                

    public lastKnownPosition: Object = null;                     //The last known location of the device
    public customPosition: Object = null;                        //A custom location specified by the user during a search. Defaults to lastKnownPosition 
    public reactiveDeviceLocation: any;                          //Observable - fires whenever device updates location and when custom location is updated
    public locationTrackingActive:boolean = true;                //If false, device will not push location updates - use startTracking() to enable.

    public useCustomLocation: boolean = false;              //Suggested default
    public lastUserQuery: Object = null;                    //The search criteria associated with the custom location
    public googleApiStatus: any;

    constructor(private _ngZone: NgZone, 
                public _searchHistory: SearchHistoryService) {

        let previousLocation = this.tryLoadFromStorage(); 
        if (previousLocation != null) {
            this.lastKnownPosition = previousLocation.lastKnownPosition || this._defaultLocation;
            this.customPosition = previousLocation.customPosition || this._defaultCustomLocation;
            this.lastUserQuery = previousLocation.lastUserQuery || null;
            this.useCustomLocation = previousLocation.defaultToCustom || false;
            this.locationTrackingActive = previousLocation.trackingEnabled || false;
        }

        else {
            this.lastKnownPosition = this._defaultLocation;
            this.customPosition = this._defaultCustomLocation;
            this.lastUserQuery = {};
        }
        var state = this.getLocation();
        this.reactiveDeviceLocation = new BehaviorSubject<Object>(state);
        this.googleApiStatus = new BehaviorSubject<Boolean>(false);

        //Pick up where we left off 
        if (this.locationTrackingActive && this.watchId == -1)
            this.startTracking();

        window['GEO'] = this; //This needs to be a singleton for battery life reasons. If unable to inject, use window['GEO'] reference to access
    
        this.waitForGoogleAPILoad();
    };

    waitForGoogleAPILoad() {
                // Retry until google maps loads, then set observable to true and stop polling

                var interval = setInterval(function () {

                    if (typeof google == "undefined") {
                        console.warn("google.maps APIs NOT ready. retry in 100ms" );
                        window['GEO'].googleApiStatus.next(false);
                    } else {
                        console.log("google.maps APIs loaded! enjoy.");
                        window['GEO'].googleApiStatus.next(true);
                        clearInterval(interval);
                    }
                }, 100);
    }

    setDefaultSource(locationSource) {
        if (locationSource == "custom") {

            this.useCustomLocation = true;

            var newLocation = this.getLocation();
            this._searchHistory.addItem("locations", newLocation)
            this.reactiveDeviceLocation.next(newLocation);
        }
        else {
            this.useCustomLocation = false;
        }

        this.saveToStorage();
    }
    //Call this to persist location info entered by user during a search
    //useAsDefault: set the custom value as the defaultPosition return by getLoaction()
    //userQuery: search criteria releated to the custom position (e.g. 94110, 23 any street, etc)
    setCustomPosition(coords, useAsDefault, userQuery) {
        this.customPosition = coords;
        this.useCustomLocation = useAsDefault
        this.lastUserQuery = userQuery;

        this.saveToStorage();
        var newLocation = this.getLocation();
        this._searchHistory.addItem("locations", newLocation)
        this.reactiveDeviceLocation.next(newLocation);
    }

    //Requests current position from device, updates values, then calls back with  
    //the latest results of getLocation()
    getUpdatedLocation(optionalCallback) {
        var opts = {maximumAge: 60000, timeout: 30000, enableHighAccuracy: true}
        let that = this;

        if (that.watchId != -1 && that.locationTrackingActive) 
            console.warn("LTS 65. Tracking is ON - please subscribe to reactiveDeviceLocation to save battery.");

        navigator.geolocation.getCurrentPosition((position) =>
                {
                        that.lastError = null;
                        console.log("LTS 70: updated position is: "+JSON.stringify(position.coords));
                        that.lastKnownPosition  = {latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy};
                        that.saveToStorage()

                        var loc = that.getLocation();
                        that.reactiveDeviceLocation.next(loc);
                        if (optionalCallback && typeof optionalCallback === 'function')
                            optionalCallback(loc, true);                    
                 },
                (err) =>
                {
                        console.log(err);
                        console.warn("LTS 82 - GPS error! Results will not be current");

                        that.lastError = err;
                        that.saveToStorage();

                        var loc = that.getLocation();
                        that.reactiveDeviceLocation.next(loc);
                        if (optionalCallback && typeof optionalCallback === 'function')
                                optionalCallback(loc, true);                    

                        //that.locationTrackingActive = false;
                },
                opts)
    }

    //Gets either custom location or device location depending on availability and user prefs.
    getLocation() {
        {
            return {
                lastKnownPosition: this.lastKnownPosition,
                customPosition: this.customPosition,
                defaultToCustom: this.useCustomLocation,
                trackingEnabled: this.locationTrackingActive,
                lastUserQuery: this.lastUserQuery,
                errorState: this.lastError || null
            }
        }
    }


    saveToStorage() {
        var locInfo = this.getLocation();
        localStorage.setItem(this._storageKey, JSON.stringify(locInfo));
    }

    //If available, gets last known location from device storage
    //otherwise returns a default value.
    tryLoadFromStorage() {
        let loc = localStorage.getItem(this._storageKey);
        if (loc != null)
        {
            console.log("Got previous location from device storage: "+loc);
            return JSON.parse(loc);
        }
        else
        {
            console.log("Nothing found in storage - default location settings will be used");
            return null;
        }
    }

    startTracking() {
            var opts = {maximumAge: 60000, timeout: 30000, enableHighAccuracy: true}
            if (this.locationTrackingActive && this.watchId != -1)
            {
                console.warn("Tracking is already active! Will reset.");
                this.stopTracking();
            }

            this.locationTrackingActive = true;
            
            let that = this; //might be better to use window['GEO'] reference
            this.watchId = navigator.geolocation.watchPosition((position) =>
                {
                        that.lastError = null;
                        console.log("LTS 82: Device is reporting position: "+JSON.stringify(position.coords));
                        that.lastKnownPosition  = {latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy};
                        that.reactiveDeviceLocation.next(that.getLocation());   
                        that.saveToStorage()                    
                 },
                (err) =>
                {
                    console.log(err);
                    that.lastError = err;
                    console.warn("LTS 122 - GPS error");
                    //that.locationTrackingActive = false;
                },
                opts);
            console.log("GPS tracking started; watchId "+this.watchId);
    }
    

    stopTracking() {
        if (this.locationTrackingActive && this.watchId != -1) {
            console.log("Stopping GPS tracking on watchId "+this.watchId);
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = -1;
            console.log("Stopped.")
        } else {
            console.warn("LTS 143: stopTracking() called but tracking not currently active. ")
        }

        this.locationTrackingActive = false;
        this.saveToStorage();
    }



    //Observerable; tracks device location and is updated by OS
    getReactiveDeviceLocation() {
        return this.reactiveDeviceLocation;
    }

    //Observable, starts off false, becomes true when google maps API is ready to be called
    getGoogleApiStatus() {
        return this.googleApiStatus;
    }
    //Recent custom locations queried by the user
    getSearchHistory() {
        return this._searchHistory.getHistory("locations");
    }
    // //Returns the last location entered as search / filter criteria by the user
    // getCustomLocation() {
    //     return this.customPosition || null;
    // }

}