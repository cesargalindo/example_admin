module.exports = {
        Context: {
            STORES: 1, 
            TOP_PAYOUTS: 2,
            REQUESTS: 3, 
            SOME_OTHER_PAGE: 4,
            LOCATIONS: 5,
            NEAR_ME: 6
        },
        QueryType: {
            ADDRESS: {text: "Address or Location", icon: "edit_location"},
            STORE_NAME: {text: "Store Name", icon: "store"},
            ITEM_NAME: {text: "Product Name", icon: "shopping_basket"},
            FULLTEXT: {text: "Search", icon: "search"} 
        },
        Filters: {
            PAYOUTS: {
                text: "Has Payouts",
                icon: "monetization_on",
                type: "switch",
                onByDefault: false
            },
            OPEN_NOW : {
                text: "Open Now",
                icon: "access_time",
                type: "switch",
                onByDefault: false
            },
            DISTANCE : {
                text: "Max Distance",
                icon: "near_me",
                type: "list",
                options: [1, 5, 10, 25, 50, 100, 500],
                onByDefault: true,
                defaultSelection: 3 //Index, not value 
            },
            STORE_TYPE: {
                text: "Establishment Type",
                icon: "search",
                type: "multi",
                onByDefault: false,
                options: [
                    {
                        text: "Grocery Stores",
                        icon: "local_grocery_store"
                    },
                    {
                        text: "Restauarants",
                        icon: "local_dining",
                    },
                    {
                        text: "Bars",
                        icon: "local_bar"
                    },
                    {
                        text: "Dispensaries",
                        icon: "smoking_rooms"
                    }
                ]
            }
        },
        Sorts: {
            POPULARITY: {
                text: "Most Popular",
                icon: "stars"
            },
            DISTANCE: {
                text: "Distance",
                icon: "near_me"
            },
            PAYOUTS: {
                text: "Highest Payouts",
                icon: "attach_money"
            },
            PRICE: {
                text: "Lowest Prices",
                icon: "trending_down"
            }
        }
}