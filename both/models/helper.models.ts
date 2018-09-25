// just an interface for type safety.

export interface SearchQuery_name {
    id?: string,
    name?: string,
    searchEntry: string,
    ss1Gunit: string,
    ss1New?: boolean
}
export interface SearchQuery_filter {
    operator: string,
    size: number, 
    unit: string,
    restrictTo?: string;
}
export interface SearchQuery_type {
    searchType: string,
    locationType: string,
}
export interface SearchQuery_store {
    storeId?: string,
    name?: string,
    address1?: string,
    address2?: string,
    lat?: number,
    lng?: number
}
export interface SearchQuery_ss {
    storeId?: string,
    name?: string,
    address1?: string,
    address2?: string,
    lat?: number,
    lng?: number
}

export interface ElasticParams {
    searchType: string,
    itemId?: string,
    name?: string,
    lat?: number,
    lng?: number, 
    operator?: string, 
    quantity?: number,
    storeId?: string,
    type?: string,
    limit?: number,
    size?: number,
    unit?: string,
    ss1Gunit?: string,
    ss1New?: boolean    
}

export interface SliderSettings {
    payRequestDefault?: number,
    payRequestMax?: number,
    minHoursDefault?: number,
    minHoursMax?: number,
    quantityDefault?: number,
    quantityMax?: number,
    scheduledTimestamp?: number,
    scheduledDate?: Date,
    scheduledHour?: number,
    scheduledMinute?: number,
    storeId?: string,
    storeName?: string,
    storeAddress?: string
}

export class RejectPriceProcess1 {
    id: string;
    rpId: string;
    spId: string;
    paidAmount: number;
    submitted: number;
    updated: number;
    status: number;
    owner: string;
    note: string;
}

export class SubmitPriceProcess {
    id: string;
    pqId: string;
    priceId: string;
    storeId: string;
    itemId: string;
    price: number;
    payoutRequest: number;
    currentDate: number;
    userId: string;
    status: number;
    soldOut: boolean;
    note: string;
    result = Array;
}


export class RequestPriceProcess {
    id: string;
    spId: string;
    pqId: string;
    priceId: string;
    storeId: string;
    itemId: string;
    price: number;
    payRequest: number;
    payRequestOrig: number;
    userId: string;
    currentDate: number;
    updated: number;
    expiresAt: number;
    requestedAt: number;
    status: number;
    note: string;
}

