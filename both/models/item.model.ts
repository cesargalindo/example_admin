export interface Item {
    _id?: string;
    owner?: string;
    name: string;
    size?: number;
    unit?: string;
    quantity: number;           // quantity = 1, prices contain different quantity values
    image?: string;
    public: number;             // Contractor: 1 = done
    note?: string;
    category?: string;
    status?: number;            // -2, rejected, -1 duplicate, 0 - inactive, 1 - flagged, 2 - active
    created: number;            // timestamp
    duplicateId?: string;
    upc?: number;
    brand?: string; 
    model?: string;
    size2?: string;
    image2?: string;
    price2?: number;
    quantity2: number;
    storeId2: string;
    tags?: Array<any>;
    deletedAt?: number;         // timestamp of when item was deleted
    updated?: number;           // timestamp of when item was last updated by item search page
    searchTitle?: string;       // primary search parameter - should be a subset of name-description
}

// export interface Categories {
//     appliance?: boolean;
//     auto?: boolean
//     baby?: boolean;
//     clothes?: boolean;
//     electronic?: boolean;
//     grocery?: boolean;
//     hardware?: boolean;
//     household?: boolean;
//     medical?: boolean;
//     pet?: boolean;
//     service?: boolean;
//     sport?: boolean;
//     toy?: boolean;
//     other?: boolean;
// }
