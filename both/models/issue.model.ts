export interface Issue  {
    _id?: string;
    severity?: string;
    priceId?: string;
    rpId?: string;
    spId?: string;
    rejPId?: string;
    itemId?: string;
    storeId?: string;
    pqId?: string;
    depId?: string;
    quantity?: number;
    created: number;                // timestamp
    expiresAt: number;              // timestamp
    requestPayout?: number;
    priceFactor?: number;
    price?: number;
    sumPayout?: number;
    note?: string;
    extra?: string;
    status: number;                 // 0 - not processed, 1 - processed/reviewed
    rpids?: Array<RPID>;
}

interface RPID {
    rpid: string;
}
