/**
 * status: CLIENT: -1 new (error, processing), 1 = ready, 2 = pending, 3 = rejected,  5 = processed
 * status: ADMIN: 0 = awaiting admin approval,  1 = active, 2 = cron-processed, 3 = cancelled
 */
export interface SubmitPrice {
    _id?: string;
    priceId: string;
    storeId?: string;       // used to carry over value
    itemId?: string;        // used to carry over value
    owner: string;
    price: number;
    submittedAt: number;    // timestamp - same as created
    updated: number;        // timestamp
    status: number;
    paidAt?: number;        // timestamp
    payout?: number;
    soldOut?: boolean;
    scheduled?: number;     // timestamp
    quantity?: number;
    note?: string;
    rpids?: Array<RPID>;
}

interface RPID {
    rpid: string;
}
