export interface ScrapeItem {
    _id?: string;
    owner?: string;
    name: string;
    size?: number;
    unit?: string;
    quantity: number;           // quantity = 1, prices contain different quantity values
    prices: Array<sprice>;
    image?: string;
    storeId: string;
    created: number;            // timestamp
    startDate?: number;
    updatedAt?: number;
    priceProcessed?: boolean;   // set to true when price has been updated, set to false when updated by scraper
    endDate?: number;
    category?: string;    
    upc?: string;    
    status?: number;            // -2, rejected, -1 duplicate, 0 - inactive, 1 - flagged, 2 - active    
    note?: string;    
    mitems?: Array<mitem>;      // contains an array of manually matched items to sprices
    validSprice?: boolean;      // set to true if this sitem contains matching sprices
}

interface mitem {
    created?: number;            // date item was matched - added to ScrapeItem
    itemId?: string;
    quantity?: number;  
}

interface sprice {
    _id?: string;
    gid?: string;
    price?: number;
    startsAt?: number;
    quantity?: number;
    sitem?: string;
}