/**
 * status: CLIENT: 9 = new (error, not updated), -1 = new (pending approval), 1 = ready, 2 = paid-pending, 3 = expired, 4 = cancelled, 5 = closed, 8 = rejected
 * status: ADMIN:  0 = awaiting admin approval,  1 = active, 2 = cron-processed, 3 = cancelled
 */
export interface RequestPrice {
    _id?: string;
    priceId?: string;
    storeId: string;           // used to carry over value
    itemId: string;            // used to carry over value
    owner: string;
    quantity: number;
    payRequest: number;
    payRequestOrig?: number;    // used to carry over value
    priceFactor: number;        // 0 = not processed, 1 = 1st submit processed, 2 = 2nd submit processed, 3 = 3rd submit processed
    requestedAt: number;		// timestamp - usually same as created -- used to 2reverse calculate date_hours -- update on updates
    expiresAt: number;			// timestamp - price request expires
    updated: number;			// timestamp
    scheduled?: number;         // timestamp
    status: number;            
    note?: string;
    paidTos?: Array<PAIDTO>;
}

interface PAIDTO {
    spId?: string;
    owner?: string;
    paidAt?: number;		    // timestamp
    payout?: number;
    status?: string;
}
