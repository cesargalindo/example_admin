export interface Tprice {
    _id?: string;
    priceId: string;
    storeId: string;
    itemId: string;
    price: number;              // price = price / gsize
    submittedAt: number;        // date - when price was submitted
    submitterId?: string;
    updated: number;            // date - when any price info is updated
    quantity: number;
    note: string;
    status: number;             // 0 - not processed, 1 - process - price added
    gsize: number;              // gsize = convert item size to global unit * price.quantity
    gunit: string;              // set to global unit: oz, fl oz, or ct
    startsAt?: number;          // ww date taken from Scraped price 
}
