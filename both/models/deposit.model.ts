export interface Deposit {
    _id?: string;
    updated: number;
    created: number;
    amount: number;
    nonce: string;
    owner: string;
    status: number;                 // -1 failed, 0 - not processed, 1 - processed
    customer?: CUSTOMER;
    transaction?: TRANSACTION;
    note?: string;
}

interface CUSTOMER {
    firstname: string;
    lastname: string;
    phone: string;
    email: string;
}

interface TRANSACTION {
    transactionId: string;
    status?: string;
    last4?: number;
    expirationDate?: string;
    cardType?: string;
}



