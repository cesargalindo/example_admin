import { Injectable} from "@angular/core";
import { Meteor } from "meteor/meteor";

const Enums = require('./search/enums.js');

@Injectable()
export class SearchHistoryService {

    private MAX_PER_CATEGORY:number = 50;
    private STORAGE_KEY:string = Meteor.settings.public.LOCAL_STORAGE_PREFIX+"zojab.history.search";
    //Re-saves whenever the collection changes. 
    private AUTOSAVE: boolean = true; 

    private localSearchHistory:any = {
       loaded:false,
       created:null,
       updated:null,
       lastSaved: null,
       data: {
        'locations':[],
        'stores':[],
        'items':[],
        'requests':[],
        'users':[],
        'searchQuery_name': '',
        'searchQuery_filter': '',
        'searchQuery_type': '',
        'searchQuery_store': '',
        'searchQuery_ss': '',
       }
    }

    constructor() { 
        console.log("SHS 26: Constructor")
    }

    public saveAll() {
        this.localSearchHistory.lastSaved = new Date();
        var hist = JSON.stringify(this.localSearchHistory);
        localStorage.setItem(this.STORAGE_KEY, hist);
        console.log("SHS 32: saved updated history");
    }

    public loadAll() {
        console.log("SHS 28: loading search history");
        var hist = localStorage.getItem(this.STORAGE_KEY);
        if (hist == null) {
            console.log("SHS 29: initializing search history");
            this.localSearchHistory.created = new Date();
            this.localSearchHistory.updated = new Date();
            this.localSearchHistory.lastSaved = null;

            // Initialize SearchQueries
            this.localSearchHistory.data['searchQuery_name'] = {
                name: null,
                id: null,
                searchEntry: null,
                ss1Gunit: null,
                ss1New: true
            };
            this.localSearchHistory.data['searchQuery_filter'] = {
                operator: 'equal to',
                size: 1,
                unit: 'ct',
                restrictTo: ''
            };
            this.localSearchHistory.data['searchQuery_type'] = {
                searchType: 'Stores near',
                locationType: 'current'
            };
            this.localSearchHistory.data['searchQuery_store'] = {
                name: 'click here to enter store name'
            };

            this.saveAll();
        } else {
            this.localSearchHistory = JSON.parse(hist);
        }

        this.localSearchHistory.loaded = true;
        console.log("SHS 47: Load Complete");
    }
    
    public getHistory(searchCategory) {
        if (!this.localSearchHistory.loaded)
        {
            console.warn("SHS 52: Not ready. Please retry");
            return null;
        }

        return this.localSearchHistory.data[searchCategory];
    }

    public addItem(searchCategory, queryItem) {
        if (!this.localSearchHistory.loaded)
        {
            console.warn("SHS 52: Not ready. Item not saved");
            return;
        }
        if (this.localSearchHistory.data[searchCategory] === undefined || this.localSearchHistory.data[searchCategory] === null) {
            this.localSearchHistory.data[searchCategory] = [];
            console.log("Added new category: "+searchCategory)
        }

        if (searchCategory.includes("searchQuery")) {
            this.localSearchHistory.data[searchCategory] = queryItem;
        }
        else {
            this.localSearchHistory.data[searchCategory].push(queryItem);
            if (this.localSearchHistory.data[searchCategory].length > this.MAX_PER_CATEGORY) {
                var removed = this.localSearchHistory.data[searchCategory].shift();
                console.warn("SHS 72: local max exceeded for "+searchCategory+" - the oldest item has been removed");
            }
        }

        this.localSearchHistory.update = new Date();
        console.log("SHS 66 - item added to search history for "+searchCategory+", will save async");
        this.saveAll();
        console.log("SHS 69 - history persisted to storage.")
    }    

    
}
