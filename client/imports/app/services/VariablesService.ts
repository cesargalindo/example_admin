import { Subject } from 'rxjs/Subject';
import { Injectable } from '@angular/core';

/**
 * Angular 2 Injectables
 * http://jbavari.github.io/blog/2015/10/19/angular-2-injectables/
 */
@Injectable()
export class VariablesService {
    labels: Object;
    errors: Object;
    msgs: Object;
    styles: Object;

    unitsList: Array<any>;
    categories: Array<any>;
    storeChains: Array<any>;

    hoursLists: Array<any>;
    minutesLists: Array<any>;

    filterTermsProduce: Array<any>;
    filterTermsMeats: Array<any>;
    filterTermsOther: Array<any>;

    selectedPriceId: string;
    selectedItemId: string;
    selectedCategory: string;
    defaultStore: Object;
    
    note: string;
    name: string;
    size: number;
    unit: string;    
    status: number;
    owner: string;
    chainName: string;
    params: Object;

    page: number;
    
    // Reactive Variables
    reactiveError: Subject<boolean> = new Subject<boolean>();
    reactiveSubmit: Subject<boolean> = new Subject<boolean>();
    reactiveHideToolbarVal: Subject<boolean> = new Subject<boolean>();
    reactiveTitleName: Subject<boolean> = new Subject<boolean>();

    // tags
    fresh: Object = {};
    frozen: Object = {};
    raw: Object = {};
    bulk: Object = {};
    organic: Object = {};
    alcohol: Object = {};
    beverage: Object = {};
    baby: Object = {};
    dairy: Object = {};
    juice: Object = {};
    pastry: Object = {};
    bread: Object = {};
    bottle: Object = {};
    cooked: Object = {};

    initializeGlobalVariables() {

        this.reactiveHideToolbarVal.next(false);

        this.labels = {};
        this.labels['name_5'] = 'Name (include brand manufacture, name, description ...)';
        this.labels['price_7'] = 'Price';
        this.labels['sold_out_8'] = 'Sold Out';

        this.labels['firstname'] = 'First Name';
        this.labels['lastname'] = 'Last Name';
        this.labels['deposit'] = 'Amount to deposit';

        this.msgs = {};

        // Error messages
        this.msgs['payRequest_isOverBalance1'] = 'The total amount of $';
        this.msgs['payRequest_isOverBalance2'] = ' exceeds your balance of $';
        this.msgs['payRequest_isOverBalance3'] = '.  Please reduce amount to pay or number of stores.';
        this.msgs['payRequest_isOverBalance'] = 'CUSTOMIZE-REPLACE';

        this.msgs['itemName_isMinLength'] = 'Name must be a string greater than 10 characters';

        this.msgs['price_isNumberic'] = 'Price must be a valid number';
        this.msgs['price_minMax'] = 'Price must be greater than $0.00 and less than $10,000';

        this.msgs['price_reject'] = 'Please enter a new price or check Sold Out to reject submitted price.';

        this.msgs['required'] = ' is required.';
        this.msgs['deposit_large'] = 'Note, any amount greater than $50.00 will require two days to process before funds are available to use.';

        this.msgs['max_store_error'] = 'The maximum number of stores allowed to submit per request is 5';

        this.unitsList = [
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

        this.categories = [
            { value: '', viewValue: '--' },
            { value: 'grocery', viewValue: 'Food: groceries, juice, spices, power bars, cereal, candy...' },
            { value: 'seedsnuts', viewValue: 'Nuts, Seeds: almonds, walnuts, sunflower, flax, peanuts...' },
            { value: 'freshproduce', viewValue: 'Fresh Produce: Vegetables, Fruits...' },
            { value: 'frozenproduce', viewValue: 'Frozen Produce: Vegetables, Fruits...' },
            { value: 'freshmeats', viewValue: 'Fresh Meats: Beef, Lamb, Chicken, Pork...' },
            { value: 'frozenmeats', viewValue: 'Frozen Meats: Beef, Lamb, Chicken, Pork...' },
            { value: 'dairy', viewValue: 'Dairy: Milk, butter, yogurt, eggs, sour cream...' },
            { value: 'bread', viewValue: 'Bread: bread, buns, biscuits, crackers, pastries, cakes...' },
            { value: '', viewValue: '--' },
            
            { value: 'alcohol', viewValue: 'Alcohol: wine, beer & sprits...' },    
            { value: 'appliance', viewValue: 'Appliances: blenders, refrigerators, ovens, washing machines...' },
            { value: 'auto', viewValue: 'Automotive: motorcycle, repairs, parts, gas, oil, services...' },
            { value: 'baby', viewValue: 'Baby-Infant: food, diapers, cribs...' },
            { value: 'clothes', viewValue: 'Clothes: shoes, socks, sweaters, hats...' },
            { value: 'electronic', viewValue: 'Electronics: stereos, TVs, phones, cables, repairs...' },
            { value: 'hardware', viewValue: 'Hardware: tools, lumber, plants, garden...' },
            { value: 'householdgoods', viewValue: 'Household Goods: laundry detergent, cleaning, toilet paper, dish soap,...' },
            { value: 'medical' , viewValue: 'Medical: cough, allergy, band aides, lotions, eye stuff, vitamins...' },        
            { value: 'pet', viewValue: 'Pet: food, toys, beds, veterinary services...' },
            { value: 'personalcare', viewValue: 'Personal Care: deodorant, lotions, hair products, shampoo, soap, shavers...' },
            { value: 'service', viewValue: 'Services: dentist, eye exams, massages, haircuts...' },
            { value: 'sport', viewValue: 'Sport: balls, bikes, parts, camping, fishing, kayaks...' },
            { value: 'toy', viewValue: 'Toy: dolls, electronic toys, games...' },
            { value: 'organicfoods', viewValue: 'Organic Foods' },
            { value: 'other', viewValue: 'Other' },
        ];
        
        this.storeChains = [
            {value: "Costco", viewValue: "Costco" },
            {value: "Trader Joes", viewValue: "Trader Joes" },
            {value: "Smart and Final", viewValue: "Smart and Final"},
            {value: "Walmart", viewValue:"Walmart"},
            {value: "Rancho San Miguel Markets", viewValue: "Rancho San Miguel Markets"},
            {value: "Raley's", viewValue: "Raley's"},
            {value: "Safeway", viewValue: "Safeway"},
            {value: "Sprouts Farmers Market", viewValue: "Sprouts Farmers Market"},
            {value: "WinCo", viewValue: "WinCo"},
            {value: "Whole Foods", viewValue: "Whole Foods"},
            {value: "Target", viewValue: "Target"},
          ];

        this.hoursLists = [
            {value: 0, viewValue: '12 pm'},
            {value: 1, viewValue: '1 am'},
            {value: 2, viewValue: '2 am'},
            {value: 3, viewValue: '3 am'},
            {value: 4, viewValue: '4 am'},
            {value: 5, viewValue: '5 am'},
            {value: 6, viewValue: '6 am'},
            {value: 7, viewValue: '7 am'},
            {value: 8, viewValue: '8 am'},
            {value: 9, viewValue: '9 am'},
            {value: 10, viewValue: '10 am'},
            {value: 11, viewValue: '11 am'},
            {value: 12, viewValue: '12 am'},
            {value: 13, viewValue: '1 pm'},
            {value: 14, viewValue: '2 pm'},
            {value: 15, viewValue: '3 pm'},
            {value: 16, viewValue: '4 pm'},
            {value: 17, viewValue: '5 pm'},
            {value: 18, viewValue: '6 pm'},
            {value: 19, viewValue: '7 pm'},
            {value: 20, viewValue: '8 pm'},
            {value: 21, viewValue: '9 pm'},
            {value: 22, viewValue: '10 pm'},
            {value: 23, viewValue: '11 pm'},
        ];

        this.minutesLists = [
            {value: 1, viewValue: 1},
            {value: 2, viewValue: 2},
            {value: 3, viewValue: 3},
            {value: 4, viewValue: 4},
            {value: 5, viewValue: 5},
            {value: 6, viewValue: 6},
            {value: 7, viewValue: 7},
            {value: 8, viewValue: 8},
            {value: 9, viewValue: 9},
            {value: 10, viewValue: 10},
            {value: 11, viewValue: 11},
            {value: 12, viewValue: 12},
            {value: 13, viewValue: 13},
            {value: 14, viewValue: 14},
            {value: 15, viewValue: 15},
            {value: 16, viewValue: 16},
            {value: 17, viewValue: 17},
            {value: 18, viewValue: 18},
            {value: 19, viewValue: 19},
            {value: 20, viewValue: 20},
            {value: 21, viewValue: 21},
            {value: 22, viewValue: 22},
            {value: 23, viewValue: 23},
            {value: 24, viewValue: 24},
            {value: 25, viewValue: 25},
            {value: 26, viewValue: 26},
            {value: 27, viewValue: 27},
            {value: 28, viewValue: 28},
            {value: 29, viewValue: 29},
            {value: 30, viewValue: 30},
            {value: 31, viewValue: 31},
            {value: 32, viewValue: 32},
            {value: 33, viewValue: 33},
            {value: 34, viewValue: 34},
            {value: 35, viewValue: 35},
            {value: 36, viewValue: 36},
            {value: 37, viewValue: 37},
            {value: 38, viewValue: 38},
            {value: 39, viewValue: 39},
            {value: 40, viewValue: 40},
            {value: 41, viewValue: 41},
            {value: 42, viewValue: 42},
            {value: 43, viewValue: 43},
            {value: 44, viewValue: 44},
            {value: 45, viewValue: 45},
            {value: 46, viewValue: 46},
            {value: 47, viewValue: 47},
            {value: 48, viewValue: 48},
            {value: 49, viewValue: 49},
            {value: 50, viewValue: 50},
            {value: 51, viewValue: 51},
            {value: 52, viewValue: 52},
            {value: 53, viewValue: 53},
            {value: 54, viewValue: 54},
            {value: 55, viewValue: 55},
            {value: 56, viewValue: 56},
            {value: 57, viewValue: 57},
            {value: 58, viewValue: 58},
            {value: 59, viewValue: 59},
        ];

        this.filterTermsProduce =[
            {value: '--', viewValue: '== FRESH PRODUCE FRUITS =='},
            {value: 'Alfalfa Sprouts', viewValue: 'Alfalfa Sprouts'},
            {value: 'apple', viewValue: 'apple'},
            {value: 'Artichoke', viewValue: 'Artichoke'},
            {value: 'Arugula', viewValue: 'Arugula'},
            {value: 'Asparagus', viewValue: 'Asparagus'},
            {value: 'Avocado', viewValue: 'Avocado'},
            {value: 'Baby Arugula', viewValue: 'Baby Arugula'},
            {value: 'banana', viewValue: 'banana'},
            {value: 'Basil', viewValue: 'Basil'},
            {value: 'Bean Sprouts', viewValue: 'Bean Sprouts'},
            {value: 'Beans Garbanzo', viewValue: 'Beans Garbanzo'},
            {value: 'Beets', viewValue: 'Beets'},
            {value: 'black grapes', viewValue: 'black grapes'},
            {value: 'Blackberries', viewValue: 'Blackberries'},
            {value: 'Blackberry', viewValue: 'Blackberry'},
            {value: 'Blueberries', viewValue: 'Blueberries'},
            {value: 'Blueberry', viewValue: 'Blueberry'},
            {value: 'Bok Choy', viewValue: 'Bok Choy'},
            {value: 'Boston Lettuce ', viewValue: 'Boston Lettuce '},
            {value: 'broccoli', viewValue: 'broccoli'},
            {value: 'Brussels Sprouts', viewValue: 'Brussels Sprouts'},
            {value: 'Butter Leaf Lettuce', viewValue: 'Butter Leaf Lettuce'},
            {value: 'Cabbage', viewValue: 'Cabbage'},
            {value: 'Cantaloupe', viewValue: 'Cantaloupe'},
            {value: 'carrot', viewValue: 'carrot'},
            {value: 'Cauliflower', viewValue: 'Cauliflower'},
            {value: 'Celery', viewValue: 'Celery'},
            {value: 'Cherries', viewValue: 'Cherries'},
            {value: 'Cherry', viewValue: 'Cherry'},
            {value: 'Chickpeas', viewValue: 'Chickpeas'},
            {value: 'Chives', viewValue: 'Chives'},
            {value: 'Cilantro', viewValue: 'Cilantro'},
            {value: 'Clementines', viewValue: 'Clementines'},
            {value: 'Coconut', viewValue: 'Coconut'},
            {value: 'Collard Greens', viewValue: 'Collard Greens'},
            {value: 'Corn', viewValue: 'Corn'},
            {value: 'Cranberries', viewValue: 'Cranberries'},
            {value: 'Cranberry', viewValue: 'Cranberry'},
            {value: 'Cucumber', viewValue: 'Cucumber'},
            {value: 'Daikon', viewValue: 'Daikon'},
            {value: 'Dandelion Greens', viewValue: 'Dandelion Greens'},
            {value: 'Dates', viewValue: 'Dates'},
            {value: 'dill', viewValue: 'dill'},
            {value: 'Eggplant', viewValue: 'Eggplant'},
            {value: 'Endive', viewValue: 'Endive'},
            {value: 'Fennel Bulb', viewValue: 'Fennel Bulb'},
            {value: 'figs', viewValue: 'figs'},
            {value: 'Garlic', viewValue: 'Garlic'},
            {value: 'Gherkins', viewValue: 'Gherkins'},
            {value: 'Ginger Root', viewValue: 'Ginger Root'},
            {value: 'grapes', viewValue: 'grapes'},
            {value: 'Grapefruit', viewValue: 'Grapefruit'},
            {value: 'Green French', viewValue: 'Green French'},
            {value: 'green grapes', viewValue: 'green grapes'},
            {value: 'Green Leaf Lettuce ', viewValue: 'Green Leaf Lettuce '},
            {value: 'jicama', viewValue: 'jicama'},
            {value: 'kale', viewValue: 'kale'},
            {value: 'Kiwi', viewValue: 'Kiwi'},
            {value: 'Kohlrabi', viewValue: 'Kohlrabi'},
            {value: 'Kumquat', viewValue: 'Kumquat'},
            {value: 'Leeks', viewValue: 'Leeks'},
            {value: 'Lemon', viewValue: 'Lemon'},
            {value: 'Lettuce', viewValue: 'Lettuce'},
            {value: 'Lettuce Romaine', viewValue: 'Lettuce Romaine'},
            {value: 'Limes', viewValue: 'Limes'},
            {value: 'Loose Leaf Lettuce', viewValue: 'Loose Leaf Lettuce'},
            {value: 'Mandarins', viewValue: 'Mandarins'},
            {value: 'mango', viewValue: 'mango'},
            {value: 'Melon', viewValue: 'Melon'},
            {value: 'Minneolas', viewValue: 'Minneolas'},
            {value: 'Mint', viewValue: 'Mint'},
            {value: 'Mushroom', viewValue: 'Mushroom'},
            {value: 'Mustard Greens', viewValue: 'Mustard Greens'},
            {value: 'Necatrine', viewValue: 'Necatrine'},
            {value: 'Okra', viewValue: 'Okra'},
            {value: 'Onions', viewValue: 'Onions'},
            {value: 'orange', viewValue: 'orange'},
            {value: 'Oregano', viewValue: 'Oregano'},
            {value: 'Papaya', viewValue: 'Papaya'},
            {value: 'Parsnips', viewValue: 'Parsnips'},
            {value: 'Peach', viewValue: 'Peach'},
            {value: 'pear', viewValue: 'pear'},
            {value: 'Peas Snap', viewValue: 'Peas Snap'},
            {value: 'Peas snow', viewValue: 'Peas snow'},
            {value: 'Peas Sugar', viewValue: 'Peas Sugar'},
            {value: 'Persimmons', viewValue: 'Persimmons'},
            {value: 'pineapple', viewValue: 'pineapple'},
            {value: 'Plantain', viewValue: 'Plantain'},
            {value: 'Plum', viewValue: 'Plum'},
            {value: 'Pluots', viewValue: 'Pluots'},
            {value: 'Pomegranates', viewValue: 'Pomegranates'},
            {value: 'potatoe', viewValue: 'potatoe'},
            {value: 'Prunes', viewValue: 'Prunes'},
            {value: 'Pumpkins', viewValue: 'Pumpkins'},
            {value: 'Radishes', viewValue: 'Radishes'},
            {value: 'Raspberry', viewValue: 'Raspberry'},
            {value: 'Raspberries', viewValue: 'Raspberries'},
            {value: 'Rosemary', viewValue: 'Rosemary'},
            {value: 'Sage', viewValue: 'Sage'},
            {value: 'Scallions', viewValue: 'Scallions'},
            {value: 'Shallots', viewValue: 'Shallots'},
            {value: 'spinach', viewValue: 'spinach'},
            {value: 'Squash', viewValue: 'Squash'},
            {value: 'Strawberries', viewValue: 'Strawberries'},
            {value: 'Strawberry', viewValue: 'Strawberry'},
            {value: 'Swiss Chard', viewValue: 'Swiss Chard'},
            {value: 'Tangelos', viewValue: 'Tangelos'},
            {value: 'Tangerines', viewValue: 'Tangerines'},
            {value: 'Tarragon', viewValue: 'Tarragon'},
            {value: 'Thyme', viewValue: 'Thyme'},
            {value: 'Tomato', viewValue: 'Tomato'},
            {value: 'Tumeric', viewValue: 'Tumeric'},
            {value: 'Turnips', viewValue: 'Turnips'},
            {value: 'Watercress', viewValue: 'Watercress'},
            {value: 'Watermelon', viewValue: 'Watermelon'},
            {value: 'Wheatgrass', viewValue: 'Wheatgrass'},
            {value: 'Yams', viewValue: 'Yams'},
            {value: 'Zucchini', viewValue: 'Zucchini'}
        ];
        this.filterTermsMeats =[    
            {value: '--', viewValue: '== RAW MEATS =='},
            {value: 'bass', viewValue: 'bass'},
            {value: 'beef', viewValue: 'beef'},
            {value: 'catfish', viewValue: 'catfish'},
            {value: 'chicken', viewValue: 'chicken'},
            {value: 'cod', viewValue: 'cod'},
            {value: 'crab', viewValue: 'crab'},
            {value: 'duck', viewValue: 'duck'},
            {value: 'Flounder', viewValue: 'Flounder'},
            {value: 'Halibut', viewValue: 'Halibut'},
            {value: 'Herring', viewValue: 'Herring'},
            {value: 'lamb', viewValue: 'lamb'},
            {value: 'lobster', viewValue: 'lobster'},
            {value: 'Mahi Mahi', viewValue: 'Mahi Mahi'},
            {value: 'Oyster', viewValue: 'Oyster'},
            {value: 'perch', viewValue: 'perch'},
            {value: 'pork', viewValue: 'pork'},
            {value: 'salmon', viewValue: 'salmon'},
            {value: 'shrimp', viewValue: 'shrimp'},
            {value: 'snapper', viewValue: 'snapper'},
            {value: 'squid', viewValue: 'squid'},
            {value: 'trout', viewValue: 'trout'},
            {value: 'tuna', viewValue: 'tuna'},
            {value: 'turkey', viewValue: 'turkey'},
            {value: 'fish', viewValue: 'fish'}
        ];
        this.filterTermsOther =[   
            {value: '--', viewValue: '== OTHER =='},
            {value: 'beer', viewValue: 'beer'},
            {value: 'bread', viewValue: 'bread'},
            {value: 'butter', viewValue: 'butter'},
            {value: 'eggs', viewValue: 'eggs'},
            {value: 'juice', viewValue: 'juice'},
            {value: 'milk', viewValue: 'milk'},
            {value: 'soda', viewValue: 'soda'},
            {value: 'yogurt', viewValue: 'yogurt'},
        ];

        // Dynamic UX / styling
        this.styles = {
            selectedListItem: {'background-color': 'yellow'},
            mapPointIcon: '/img/map_point.png',
            myLocationIcon: '/img/my_location.png'
        }

        this.resetFormErrorVairables();
    }

    initTagObjValue(z, id) {
        switch (z) {
            case 'fresh':
                this.fresh[id] = true;
                break;
            case 'frozen':
                this.frozen[id] = true;
                break;
            case 'raw':
                this.raw[id] = true;
                break;
            case 'bulk':
                this.bulk[id] = true;
                break;
            case 'organic':
                this.organic[id] = true;
                break;
            case 'alcohol':
                this.alcohol[id] = true;
                break;
            case 'beverage':
                this.beverage[id] = true;
                break;
            case 'baby':
                this.baby[id] = true;
                break;
            case 'dairy':
                this.dairy[id] = true;
                break;   
            case 'juice':
                this.juice[id] = true;
                break;
            case 'bread':
                this.bread[id] = true;
                break;
            case 'pastry':
                this.pastry[id] = true;
                break;
            case 'bottle':
                this.bottle[id] = true;
                break;
            case 'cooked':
                this.cooked[id] = true;
                break;
        }
    }


    setTagObjValue(tag, id) {
        switch (tag) {
            case 'fresh':
                if (this.fresh[id])         { this.fresh[id] = false; }
                else                        { this.fresh[id] = true; }
                break;
            case 'frozen':
                if (this.frozen[id])        { this.frozen[id] = false; }
                else                        { this.frozen[id] = true; }
                break;
            case 'raw':
                if (this.raw[id])           { this.raw[id] = false; }
                else                        { this.raw[id] = true; }
                break;
            case 'bulk':
                if (this.bulk[id])          { this.bulk[id] = false; }
                else                        { this.bulk[id] = true; }
                break;
            case 'organic':
                if (this.organic[id])       { this.organic[id] = false; }
                else                        { this.organic[id] = true; }
                break;
            case 'alcohol':
                if (this.alcohol[id])       { this.alcohol[id] = false; }
                else                        { this.alcohol[id] = true; }
                break;
            case 'beverage':
                if (this.beverage[id])      { this.beverage[id] = false; }
                else                        { this.beverage[id] = true; }
                break;
            case 'baby':
                if (this.baby[id])          { this.baby[id] = false; }
                else                        { this.baby[id] = true; }
                break;
            case 'dairy':
                if (this.dairy[id])         { this.dairy[id] = false; }
                else                        { this.dairy[id] = true; }
                break;
            case 'juice':
                if (this.juice[id])         { this.juice[id] = false; }
                else                        { this.juice[id] = true; }
                break;
            case 'pastry':
                if (this.pastry[id])        { this.pastry[id] = false; }
                else                        { this.pastry[id] = true; }
                break;
            case 'bread':
                if (this.bread[id])         { this.bread[id] = false; }
                else                        { this.bread[id] = true; }
                break;
            case 'bottle':
                if (this.bottle[id])        { this.bottle[id] = false; }
                else                        { this.bottle[id] = true; }
                break;
            case 'cooked':
                if (this.cooked[id])        { this.cooked[id] = false; }
                else                        { this.cooked[id] = true; }
                break;
        }
    }


    createTagObjArray(id) {
        let i = 0;
        let tags = [];
        if (this.fresh[id]) {
            tags[i] = 'fresh';
            i++;
        }
        if (this.frozen[id]) {
            tags[i] = 'frozen';
            i++;
        }
        if (this.raw[id]) {
            tags[i] = 'raw';
            i++;
        }
        if (this.bulk[id]) {
            tags[i] = 'bulk';
            i++;
        }
        if (this.organic[id]) {
            tags[i] = 'organic';
            i++;
        }
        if (this.alcohol[id]) {
            tags[i] = 'alcohol';
            i++;
        }
        if (this.beverage[id]) { 
            tags[i] = 'beverage';
            i++;
        }
        if (this.baby[id]) {
            tags[i] = 'baby';
            i++;
        }
        if (this.dairy[id]) { 
            tags[i] = 'dairy';
            i++;
        }
        if (this.juice[id]) { 
            tags[i] = 'juice';
            i++;
        }
        if (this.bottle[id]) {
            tags[i] = 'bottle';
            i++;
        }
        if (this.bread[id]) {
            tags[i] = 'bread';
        }
        if (this.pastry[id]) {
            tags[i] = 'pastry';
        }
        if (this.cooked[id]) {
            tags[i] = 'cooked';
        }
        return tags;
    }


    resetFormErrorVairables() {
        this.errors = {};
        this.errors['error'] = '';
        this.errors['success'] = '';

        this.errors['payRequest_isOverBalance'] = false;

        this.errors['itemName_isMinLength'] = false;

        this.errors['price_isNumberic'] = false;
        this.errors['price_minMax'] = false;
    }


    /**
     *
     * Process Form Validations Errors
     *
     */
    processFormControlErrors(formControlErrors, validateFields) {

        if (validateFields.itemName) {
            if (formControlErrors.itemName._status == 'INVALID') {
                this.errors['itemName_isMinLength'] = true;
            }
            else {
                this.errors['itemName_isMinLength'] = false;
            }
        }

        if (validateFields.price) {
            if (formControlErrors.price._status == 'INVALID') {

                if (formControlErrors.price.errors.isNumeric) {
                    this.errors['price_isNumberic'] = true;
                    this.errors['price_minMax'] = false;
                } else {
                    this.errors['price_isNumberic'] = false;
                    this.errors['price_minMax'] = true;
                }
            }
            else {
                this.errors['price_isNumberic'] = false;
                this.errors['price_minMax']= false;
            }
        }


        return this.errors;
    }

    /**
     * Reactive variables for Snackbar, Progress, etc.
     */
    setReactiveError() {
        this.reactiveError.next(true);
        this.reactiveSubmit.next(false);
    }
    getReactiveError() {
        return this.reactiveError;
    }


    /**
     * Reactive variable for Titles on Edit forms
     */
    setReactiveHideToolbar(display) {
        this.reactiveHideToolbarVal.next(display);
    }
    getReactiveHideToolbar() {
        return this.reactiveHideToolbarVal;
    }


    /**
     * Reactive variable for Titles names on other pages
     */
    setReactiveTitleName(display) {
        this.reactiveTitleName.next(display);
    }
    getReactiveTitleName() {
        return this.reactiveTitleName;
    }


}

