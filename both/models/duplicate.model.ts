export interface Duplicate {
    _id?: string;
    created: number;                // timestamp    
    status?: number;                // 0 - duplicate item, 1 - processed, 20 - duplicate Sitem-item match, 21 - processed
    note?: string;
    scrapedStore?: string;
    dupitems?: Array<DUPITEM>;
}

interface DUPITEM {
    itemId?: string;
    sitemId?: string;
}
