export interface Price {
    _id?: string;
    storeId: string;
    itemId: string;
    price: number;              // price = price / gsize
    submittedAt: number;        // date - when price was submitted
    submitterId?: string;
    payoutRequest?: number;
    expiresAt?: number;         // date - when payout request expires
    updated: number;            // date - when any price info is updated
    quantity: number;
    note: string;
    distance?: number;          // local use - dynamically updated when loaded in client
    soldOut?: boolean;
    gsize: number;              // gsize = convert item size to global unit * price.quantity
    gunit: string;              // set to global unit: oz, fl oz, or ct
    startsAt?: number;          // ww date taken from Scraped price 
}
